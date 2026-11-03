'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, CartItem, SupplyItem } from '@/lib/types';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, notes?: string, originalItem?: SupplyItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateNotes: (productId: string, notes: string) => void;
  clearCart: () => void;
  /** Pendientes del pedido que no tienen precio (p. ej. libros por cotizar) */
  notasPedido: string[];
  setNotasPedido: (notas: string[]) => void;
  /** Lista de útiles de la que viene el carrito */
  listaId: string | null;
  setListaId: (id: string | null) => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [notasPedido, setNotasPedido] = useState<string[]>([]);
  const [listaId, setListaId] = useState<string | null>(null);
  const [cargado, setCargado] = useState(false);

  // El carrito vive en localStorage, que solo existe en el navegador: se lee al montar
  // (no en el estado inicial) para que el HTML del servidor y el del cliente coincidan.
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cart');
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura única de localStorage tras hidratar
      if (stored) setItems(JSON.parse(stored));
      const extra = localStorage.getItem('cart_extra');
      if (extra) {
        const e = JSON.parse(extra);
        setNotasPedido(Array.isArray(e.notasPedido) ? e.notasPedido : []);
        setListaId(e.listaId ?? null);
      }
    } catch { /* carrito dañado: se empieza vacío */ }
    setCargado(true);
  }, []);

  useEffect(() => {
    if (!cargado) return;
    localStorage.setItem('cart', JSON.stringify(items));
    localStorage.setItem('cart_extra', JSON.stringify({ notasPedido, listaId }));
  }, [items, notasPedido, listaId, cargado]);

  const addItem = (product: Product, quantity = 1, notes?: string, originalItem?: SupplyItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { product, quantity, notes, originalItem }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      )
    );
  };

  const updateNotes = (productId: string, notes: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, notes } : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setNotasPedido([]);
    setListaId(null);
  };

  const total = items.reduce((sum, item) => sum + item.product.basePrice * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateNotes,
        clearCart,
        notasPedido,
        setNotasPedido,
        listaId,
        setListaId,
        total,
        itemCount,
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