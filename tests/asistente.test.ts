/**
 * Pruebas del asistente de la web agéntica (docs/web-agentica.md):
 * - ReadyPage contra el servidor de demostración, con un carrito de prueba.
 * - public/site-actions.js con el registro y el validador de argumentos del runtime oficial.
 * - Que el manifiesto publique exactamente las acciones registradas.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ReadyPage, normalizar, type CarritoPort } from "@/agentic/ready-page";
import type { CartItem, NotaPedido, Product } from "@/lib/types";
import type { LineaNueva } from "@/lib/cart-context";
import { ActionRegistry, validateData } from "../public/runtime/actions.js";
import { definitions, registerActions } from "../public/site-actions.js";

/** Carrito en memoria con la misma forma que useCart(); cada cambio crea un objeto nuevo, como un render. */
function carritoDePrueba() {
  let estado: CarritoPort;
  const crear = (items: CartItem[], notas: NotaPedido[]): CarritoPort => ({
    items,
    notasPedido: notas,
    total: items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
    addItem: (product: Product, quantity = 1) => {
      estado = crear([...items, { id: product.id, product, quantity, unitPrice: product.salePrice ?? product.basePrice }], notas);
    },
    replaceList: (listaId: string, para: string, lineas: LineaNueva[], nuevas: string[]) => {
      const otras = items.filter(i => i.listaId !== listaId);
      const propias = lineas.map((l, k) => ({
        id: `${listaId}-${k}`, product: l.product, quantity: l.quantity, unitPrice: l.unitPrice ?? l.product.salePrice ?? l.product.basePrice, para, listaId,
      }));
      estado = crear([...otras, ...propias], nuevas.map(texto => ({ texto, listaId, para })));
      return para;
    },
  });
  estado = crear([], []);
  return () => estado;
}

describe("ReadyPage (modo demo)", () => {
  const page = () => new ReadyPage(carritoDePrueba());

  it("encuentra listas oficiales sin importar tildes ni mayúsculas", async () => {
    const r = await page().findSchoolLists({ colegio: "los alamos", grado: "2do PRIMARIA" });
    expect(r.listas).toEqual([expect.objectContaining({ listId: "lista-alamos-2p", colegio: "Colegio Los Álamos" })]);
  });

  it("sugiere colegios cuando no hay coincidencias", async () => {
    const r = await page().findSchoolLists({ colegio: "colegio inexistente" });
    expect(r.listas).toEqual([]);
    expect(r.colegiosConListas?.length).toBeGreaterThan(0);
  });

  it("cotiza los tres paquetes con las funciones de la página, de menor a mayor", async () => {
    const r = await page().quoteList({ listId: "lista-alamos-2p" });
    if (!r.ok) throw new Error(r.reason);
    const [eco, medio, premium] = r.paquetes.map(p => p.total);
    expect(r.paquetes.map(p => p.nivel)).toEqual(["economico", "medio", "premium"]);
    expect(eco).toBeLessThan(medio);
    expect(medio).toBeLessThan(premium);
  });

  it("rechaza sin cambiar nada", async () => {
    const p = page();
    expect(await p.quoteList({ listId: "no-existe" })).toMatchObject({ ok: false, field: "listId" });
    expect(await p.addProductToCart({ productId: "no-existe", cantidad: 1 })).toMatchObject({ ok: false, field: "productId" });
    expect(await p.addProductToCart({ productId: "x", cantidad: 0 })).toMatchObject({ ok: false, field: "cantidad" });
    expect(await p.searchProducts({ consulta: "  " })).toMatchObject({ ok: false, field: "consulta" });
    expect(p.getCart().lineas).toEqual([]);
  });

  it("agrega una lista en un paquete con el mismo total que la cotización, sin duplicar", async () => {
    const p = page();
    const cot = await p.quoteList({ listId: "lista-alamos-2p" });
    if (!cot.ok) throw new Error(cot.reason);
    const r1 = await p.addListToCart({ listId: "lista-alamos-2p", nivel: "economico" });
    const r2 = await p.addListToCart({ listId: "lista-alamos-2p", nivel: "economico" });
    if (!r1.ok || !r2.ok) throw new Error("rechazado");
    expect(r2.total).toBe(r1.total);
    expect(r1.total).toBeCloseTo(cot.paquetes[0]!.total, 2);
  });

  it("busca productos y agrega uno al carrito", async () => {
    const p = page();
    const r = await p.searchProducts({ consulta: "cuaderno" });
    if (!r.ok) throw new Error(r.reason);
    expect(r.productos.length).toBeGreaterThan(0);
    const agregado = await p.addProductToCart({ productId: r.productos[0]!.productId, cantidad: 2 });
    expect(agregado).toMatchObject({ ok: true, agregado: { cantidad: 2 } });
  });

  it("lee el envío y el WhatsApp de los ajustes de la tienda", async () => {
    const r = await page().getStoreInfo();
    expect(r.envio.costo).toBeGreaterThan(0);
    expect(r.whatsapp).toBeTruthy();
  });

  it("normaliza texto como lo escribe un padre", () => {
    expect(normalizar("  Colegio  LOS Álamos ")).toBe("colegio los alamos");
  });
});

describe("public/site-actions.js con el runtime oficial", () => {
  const manifiesto = JSON.parse(readFileSync(new URL("../public/agent-manifest.json", import.meta.url), "utf8"));

  it("registra exactamente las acciones de agentTools", async () => {
    const registro = new ActionRegistry();
    const alcance = { base: "https://ready.example/", network: "ready_utiles" };
    await registerActions({ register: (d: object) => registro.register(alcance, d) });
    const nombres = registro.catalog(alcance).map((a: { name: string }) => a.name).sort();
    expect(nombres).toEqual([...manifiesto.actions.agentTools].sort());
  });

  it("el validador del runtime rechaza argumentos fuera del esquema", () => {
    const porNombre = new Map(definitions().map((d: { name: string }) => [d.name, d]));
    const agregar = porNombre.get("add_list_to_cart") as unknown as { inputSchema: object };
    expect(() => validateData(agregar.inputSchema, { listId: "x", nivel: "lujo" })).toThrow();
    expect(() => validateData(agregar.inputSchema, { listId: "x", nivel: "economico" })).not.toThrow();
  });

  it("sin la tienda en la página, la acción falla como 'desconocido'", () => {
    const leer = definitions().find((d: { name: string }) => d.name === "get_store_info") as { execute: () => unknown };
    expect(() => leer.execute()).toThrow(/no está corriendo/);
  });
});
