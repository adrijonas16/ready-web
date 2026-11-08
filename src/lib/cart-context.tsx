'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Product, CartItem, NotaPedido } from '@/lib/types';
import { precioVenta, redondear } from '@/lib/precio';
import { datosItems, evento, itemGA } from '@/lib/analytics';

/** Datos de una línea al agregarla. Sin unitPrice se usa el precio de venta del producto (+ recargo). */
export interface OpcionesLinea {
  notes?: string;
  para?: string;
  listaId?: string;
  unitPrice?: number;
  listPrice?: number;
  recargo?: number;
}

export type LineaNueva = OpcionesLinea & { product: Product; quantity: number };

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, opciones?: OpcionesLinea) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  /** Quita todas las líneas (y notas por cotizar) de un "para quién" */
  removeGroup: (para: string | null) => void;
  /** Reemplaza las líneas y notas de una lista (volver a agregarla no duplica). Devuelve el "para" usado. */
  replaceList: (listaId: string, para: string, lineas: LineaNueva[], notas: string[]) => string;
  /** Líneas de una lista que ya están en el carrito */
  lineasDeLista: (listaId: string) => CartItem[];
  clearCart: () => void;
  /** Pendientes del pedido sin precio (libros por cotizar, útiles por conseguir) */
  notasPedido: NotaPedido[];
  /** Listas de útiles de las que vienen las líneas */
  listaIds: string[];
  total: number;
  /** Lo que se ahorra por las ofertas */
  ahorro: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/** Identidad de la línea: producto + notas + precio + para quién. */
export const claveLinea = (productId: string, notes: string | undefined, unitPrice: number, para: string | undefined) =>
  [productId, (notes ?? '').trim(), unitPrice.toFixed(2), (para ?? '').trim()].join('|');

function crearLinea(product: Product, quantity: number, o: OpcionesLinea = {}): CartItem {
  const recargo = o.recargo ?? 0;
  const unitPrice = redondear(o.unitPrice ?? precioVenta(product) + recargo);
  const listPrice = redondear(o.listPrice ?? product.basePrice + recargo);
  return {
    id: claveLinea(product.id, o.notes, unitPrice, o.para),
    product, quantity, unitPrice,
    ...(listPrice > unitPrice ? { listPrice } : {}),
    ...(recargo ? { recargo } : {}),
    ...(o.notes ? { notes: o.notes } : {}),
    ...(o.para ? { para: o.para } : {}),
    ...(o.listaId ? { listaId: o.listaId } : {}),
  };
}

/** Suma una línea a la lista: si ya hay una igual, sube la cantidad. */
function sumar(prev: CartItem[], linea: CartItem): CartItem[] {
  const existente = prev.find(i => i.id === linea.id);
  if (existente) return prev.map(i => (i.id === linea.id ? { ...i, quantity: i.quantity + linea.quantity } : i));
  return [...prev, linea];
}

/** Carritos guardados con la forma anterior (sin id ni unitPrice). */
function migrar(crudo: unknown): CartItem[] {
  if (!Array.isArray(crudo)) return [];
  return crudo.reduce<CartItem[]>((acc, x) => {
    if (!x || typeof x !== 'object' || !('product' in x)) return acc;
    const i = x as Partial<CartItem> & { product: Product };
    if (i.id && typeof i.unitPrice === 'number') return sumar(acc, i as CartItem);
    return sumar(acc, crearLinea(i.product, Number(i.quantity) || 1, { notes: i.notes, unitPrice: i.product.basePrice }));
  }, []);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [notasPedido, setNotasPedido] = useState<NotaPedido[]>([]);
  const [cargado, setCargado] = useState(false);

  // El carrito vive en localStorage, que solo existe en el navegador: se lee al montar
  // (no en el estado inicial) para que el HTML del servidor y el del cliente coincidan.
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cart');
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura única de localStorage tras hidratar
      if (stored) setItems(migrar(JSON.parse(stored)));
      const extra = localStorage.getItem('cart_extra');
      if (extra) {
        const e = JSON.parse(extra);
        const notas: unknown[] = Array.isArray(e.notasPedido) ? e.notasPedido : [];
        setNotasPedido(notas.map(n => (typeof n === 'string' ? { texto: n, listaId: e.listaId ?? undefined } : n as NotaPedido)).filter(n => n?.texto));
      }
    } catch { /* carrito dañado: se empieza vacío */ }
    setCargado(true);
  }, []);

  // Otras pestañas: si cambian el carrito, se refleja aquí
  useEffect(() => {
    const alCambiar = (e: StorageEvent) => {
      if (e.key === 'cart' && e.newValue) { try { setItems(migrar(JSON.parse(e.newValue))); } catch { /* nada */ } }
    };
    window.addEventListener('storage', alCambiar);
    return () => window.removeEventListener('storage', alCambiar);
  }, []);

  const listaIds = useMemo(
    () => Array.from(new Set([...items.map(i => i.listaId), ...notasPedido.map(n => n.listaId)].filter(Boolean) as string[])),
    [items, notasPedido]);

  useEffect(() => {
    if (!cargado) return;
    localStorage.setItem('cart', JSON.stringify(items));
    localStorage.setItem('cart_extra', JSON.stringify({ notasPedido, listaIds }));
  }, [items, notasPedido, listaIds, cargado]);

  const addItem = useCallback((product: Product, quantity = 1, opciones?: OpcionesLinea) => {
    const linea = crearLinea(product, quantity, opciones);
    setItems(prev => sumar(prev, linea));
    evento('add_to_cart', datosItems([itemGA(product, linea.unitPrice, quantity)]));
  }, []);

  const removeItem = useCallback((lineId: string) => setItems(prev => prev.filter(i => i.id !== lineId)), []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    if (quantity <= 0) { setItems(prev => prev.filter(i => i.id !== lineId)); return; }
    setItems(prev => prev.map(i => (i.id === lineId ? { ...i, quantity } : i)));
  }, []);

  const removeGroup = useCallback((para: string | null) => {
    setItems(prev => prev.filter(i => (i.para ?? null) !== para));
    setNotasPedido(prev => prev.filter(n => (n.para ?? null) !== para));
  }, []);

  const replaceList = (listaId: string, paraBase: string, lineas: LineaNueva[], notas: string[]) => {
    // Si otra lista ya usa el mismo nombre (p. ej. mellizos sin nombre en la etiqueta), se numera
    const otros = new Set([...items, ...notasPedido].filter(x => x.listaId && x.listaId !== listaId).map(x => x.para));
    let para = paraBase;
    for (let n = 2; otros.has(para); n++) para = `${paraBase} (${n})`;
    setItems(prev => lineas.reduce(
      (acc, l) => sumar(acc, crearLinea(l.product, l.quantity, { ...l, para, listaId })),
      prev.filter(i => i.listaId !== listaId)));
    setNotasPedido(prev => [...prev.filter(n => n.listaId !== listaId), ...notas.map(texto => ({ texto, listaId, para }))]);
    evento('add_to_cart', datosItems(lineas.map(l => itemGA(l.product, crearLinea(l.product, l.quantity, l).unitPrice, l.quantity)), { item_list_id: listaId }));
    return para;
  };

  const lineasDeLista = useCallback((listaId: string) => items.filter(i => i.listaId === listaId), [items]);

  const clearCart = useCallback(() => { setItems([]); setNotasPedido([]); }, []);

  const total = redondear(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
  const ahorro = redondear(items.reduce((sum, item) => sum + ((item.listPrice ?? item.unitPrice) - item.unitPrice) * item.quantity, 0));
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items, addItem, removeItem, updateQuantity, removeGroup, replaceList, lineasDeLista, clearCart,
        notasPedido, listaIds, total, ahorro, itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

/** Agrupa las líneas por "para quién" (las del catálogo van al final como "Otros productos"). */
export function agruparPorPara<T extends { para?: string | null }>(lineas: T[]): { para: string | null; lineas: T[] }[] {
  const grupos = new Map<string | null, T[]>();
  for (const l of lineas) {
    const k = l.para ?? null;
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k)!.push(l);
  }
  return [...grupos.entries()].sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : 0)).map(([para, lineas]) => ({ para, lineas }));
}
