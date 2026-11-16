/**
 * ReadyPage: las operaciones de la tienda tal como las llama el asistente.
 *
 * Es el "page object" del patrón de acciones de la web agéntica abierta (skill
 * `.claude/skills/agentify-website`, referencia `references/site_actions.md`):
 * `public/site-actions.js` envuelve cada método como una herramienta `website_*`.
 *
 * Reglas (ver docs/web-agentica.md):
 * - Usa las MISMAS funciones que la página (cliente de API, `totalPaquete`, `faltantes`,
 *   carrito), así el asistente y el padre siguen las mismas reglas de precios.
 * - Entradas y salidas son JSON simple; nunca objetos vivos.
 * - Una entrada inválida devuelve `{ok: false, reason, field}` y no cambia nada. Solo se lanza
 *   un error ante fallos inesperados (el runtime lo informa como "desconocido").
 * - Nada aquí crea pedidos ni cobra: el padre confirma el pedido en /cart.
 */
import { listsApi, productsApi, schoolsApi, settingsApi } from '@/services/api';
import { TIERS, cantidadDe, tierProduct, type Tier } from '@/lib/lista';
import { faltantes, totalPaquete } from '@/components/lista/Paquetes';
import { precioVenta, redondear } from '@/lib/precio';
import type { CartItem, NotaPedido, Product, SupplyItem } from '@/lib/types';
import type { LineaNueva, OpcionesLinea } from '@/lib/cart-context';

/** Lo que el asistente necesita del carrito (lo provee CartProvider vía useCart). */
export interface CarritoPort {
  items: CartItem[];
  total: number;
  notasPedido: NotaPedido[];
  addItem: (product: Product, quantity?: number, opciones?: OpcionesLinea) => void;
  replaceList: (listaId: string, para: string, lineas: LineaNueva[], notas: string[]) => string;
}

export type Rechazo = { ok: false; reason: string; field?: string };

const MAX_RESULTADOS = 10;
const NIVELES = TIERS.map(t => t.id);

const rechazo = (reason: string, field?: string): Rechazo => (field ? { ok: false, reason, field } : { ok: false, reason });

/** Minúsculas y sin tildes, para comparar lo que escribe el padre con los nombres. */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Coincide si todas las palabras de la consulta aparecen en el texto (ignora palabras de 1 letra). */
function coincide(texto: string, consulta?: string): boolean {
  if (!consulta?.trim()) return true;
  const t = normalizar(texto);
  return normalizar(consulta).split(' ').filter(p => p.length > 1).every(p => t.includes(p));
}

function producto(p: Product) {
  return {
    productId: p.id,
    nombre: p.name,
    marca: p.brand ?? null,
    categoria: p.category,
    precio: precioVenta(p),
    precioNormal: p.basePrice,
    stock: p.stock,
    nivel: p.tier ?? null,
  };
}

export class ReadyPage {
  /** `carrito` se lee en cada llamada: el CartProvider cambia su valor en cada render. */
  constructor(private readonly carrito: () => CarritoPort | null) {}

  private cart(): CarritoPort {
    const c = this.carrito();
    if (!c) throw new Error('El carrito aún no está listo en esta página.');
    return c;
  }

  /**
   * Espera a que React dibuje el carrito después de un cambio (setState es asíncrono y la
   * ref se actualiza al confirmar el render). Así lo que devolvemos es el carrito real.
   */
  private async carritoTrasCambio(antes: CarritoPort, intentos = 60): Promise<void> {
    for (let i = 0; i < intentos && this.carrito() === antes; i += 1) {
      await new Promise(r => setTimeout(r, 16));
    }
  }

  /* ---------------------------------------------------------------- lecturas */

  /** Listas oficiales que coinciden con el colegio y el grado escritos por el padre. */
  async findSchoolLists(args: { colegio?: string; grado?: string }) {
    const listas = await listsApi.getOfficial();
    const encontradas = listas
      .filter(l => coincide(l.schoolName, args.colegio) && coincide(l.gradeName, args.grado))
      .slice(0, MAX_RESULTADOS)
      .map(l => ({ listId: l.id, colegio: l.schoolName, grado: l.gradeName, anio: l.year }));
    if (encontradas.length) return { ok: true as const, listas: encontradas };
    const colegios = await schoolsApi.getAll();
    return {
      ok: true as const,
      listas: [],
      nota: 'No hay lista oficial que coincida. El padre puede subir la foto de su lista en /lists.',
      colegiosConListas: [...new Set(listas.map(l => l.schoolName))],
      colegiosRegistrados: colegios.slice(0, 30).map(c => c.name),
    };
  }

  /** Cotiza una lista oficial en los tres paquetes, con las mismas funciones que la página. */
  async quoteList(args: { listId: string }) {
    let detalle;
    try {
      detalle = await listsApi.getById(args.listId);
    } catch {
      return rechazo(`No existe la lista '${args.listId}'. Búscala primero con website_find_school_lists.`, 'listId');
    }
    const { list, items } = detalle;
    const nombre = (i: SupplyItem) => i.nombreOriginal;
    return {
      ok: true as const,
      listId: list.id,
      colegio: list.schoolName,
      grado: list.gradeName,
      anio: list.year,
      utiles: items.length,
      paquetes: TIERS.map(t => ({
        nivel: t.id,
        nombre: t.label,
        descripcion: t.desc,
        total: redondear(totalPaquete(items, t.id, cantidadDe)),
        faltan: faltantes(items, t.id).map(nombre),
      })),
      enlace: `/lists/${list.id}`,
      nota: 'Los totales no incluyen envío, forrado, etiquetas ni libros: el padre los elige en la página de la lista.',
    };
  }

  async searchProducts(args: { consulta: string; categoria?: string; precioMaximo?: number }) {
    const consulta = args.consulta?.trim();
    if (!consulta) return rechazo('Escribe qué producto buscar.', 'consulta');
    const resultados = await productsApi.search(consulta, args.categoria || undefined);
    const filtrados = resultados
      .filter(p => p.isActive !== false)
      .filter(p => args.precioMaximo == null || precioVenta(p) <= args.precioMaximo)
      .slice(0, MAX_RESULTADOS)
      .map(producto);
    return { ok: true as const, productos: filtrados, total: filtrados.length };
  }

  async getStoreInfo() {
    const [a, categorias] = await Promise.all([settingsApi.get(), productsApi.getCategories()]);
    return {
      ok: true as const,
      envio: {
        costo: a.costoEnvio,
        gratisDesde: a.envioGratisDesde,
        diasHabiles: a.diasEntrega,
        horario: a.horarioEntrega,
        zonas: a.zonas ?? null,
        coberturaNacional: a.coberturaNacional ?? false,
        costoProvincias: a.costoEnvioProvincias ?? null,
        diasProvincias: a.diasEntregaProvincias ?? null,
      },
      whatsapp: a.whatsapp,
      telefono: a.telefono,
      categorias,
      pago: 'El padre revisa el carrito y confirma el pedido en /cart. El asistente no cobra ni confirma pedidos.',
    };
  }

  getCart() {
    const c = this.cart();
    return {
      ok: true as const,
      lineas: c.items.map(i => ({
        nombre: i.product.name,
        cantidad: i.quantity,
        precioUnitario: i.unitPrice,
        para: i.para ?? null,
      })),
      pendientes: c.notasPedido.map(n => n.texto),
      total: redondear(c.total),
      enlace: '/cart',
    };
  }

  /* ---------------------------------------------------------------- escrituras */

  async addProductToCart(args: { productId: string; cantidad: number }) {
    if (!Number.isInteger(args.cantidad) || args.cantidad < 1 || args.cantidad > 99) {
      return rechazo('La cantidad debe ser un número entero entre 1 y 99.', 'cantidad');
    }
    let p: Product;
    try {
      p = await productsApi.getById(args.productId);
    } catch {
      return rechazo(`No existe el producto '${args.productId}'. Búscalo con website_search_products.`, 'productId');
    }
    if (p.isActive === false) return rechazo(`'${p.name}' ya no está a la venta.`, 'productId');
    if (p.stock < args.cantidad) {
      return rechazo(`Solo quedan ${p.stock} unidades de '${p.name}'.`, 'cantidad');
    }
    const antes = this.cart();
    antes.addItem(p, args.cantidad);
    await this.carritoTrasCambio(antes);
    return { ...this.getCart(), agregado: { nombre: p.name, cantidad: args.cantidad } };
  }

  /**
   * Agrega una lista oficial completa en un paquete, como el botón de la página (sin extras).
   * Volver a agregarla reemplaza lo anterior de esa lista: no duplica.
   */
  async addListToCart(args: { listId: string; nivel: Tier }) {
    if (!NIVELES.includes(args.nivel)) return rechazo(`El paquete debe ser uno de: ${NIVELES.join(', ')}.`, 'nivel');
    let detalle;
    try {
      detalle = await listsApi.getById(args.listId);
    } catch {
      return rechazo(`No existe la lista '${args.listId}'.`, 'listId');
    }
    const { list, items } = detalle;
    const lineas: LineaNueva[] = [];
    const porConseguir: string[] = [];
    for (const i of items) {
      const p = i.agregado ? i.matchedProduct : tierProduct(i, args.nivel);
      if (p) lineas.push({ product: p, quantity: cantidadDe(i), notes: i.notas || undefined });
      else porConseguir.push(`${i.nombreOriginal} x${cantidadDe(i)}`);
    }
    if (!lineas.length) return rechazo('Esa lista no tiene productos en este paquete.', 'nivel');
    const notas = porConseguir.length ? [`Útiles por conseguir: ${porConseguir.join('; ')}`] : [];
    const antes = this.cart();
    const para = antes.replaceList(list.id, `${list.schoolName} · ${list.gradeName}`, lineas, notas);
    await this.carritoTrasCambio(antes);
    return { ...this.getCart(), agregado: { lista: `${list.schoolName} · ${list.gradeName}`, paquete: args.nivel, para } };
  }
}
