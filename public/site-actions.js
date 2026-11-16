// Acciones de Ready para el runtime de la web agéntica abierta.
// agent-manifest.json carga este módulo con "actions.module". Solo los nombres de
// "actions.agentTools" se vuelven herramientas del modelo, llamadas website_<nombre>.
//
// Cada acción envuelve un método de ReadyPage (src/agentic/ready-page.ts), el "page object"
// que la app crea al cargar y expone como globalThis.readyPage. La lógica de negocio vive
// ahí, no aquí. Para agregar una acción, sigue docs/web-agentica.md.
//
// Efectos: "read" no cambia nada; "write" cambia solo el carrito, que el padre puede
// revisar y vaciar. Ninguna acción crea pedidos ni cobra, por eso no hay "irreversible".

/**
 * El page object, o un error que el runtime informa como "desconocido" cuando la tienda
 * no está corriendo en esta página (por ejemplo, en el puente oculto de otro sitio).
 *
 * :return: La instancia de ReadyPage.
 */
function page() {
  const ready = globalThis.readyPage;
  if (!ready) {
    throw new Error("La tienda Ready no está corriendo en esta página.");
  }
  return ready;
}

const LIST_ID = {
  type: "string",
  minLength: 1,
  maxLength: 80,
  description: "El listId que devolvió website_find_school_lists.",
};

class SiteActions {
  /**
   * Registra cada acción en el runtime.
   *
   * :param actions: La fachada del registro del runtime, con un método register(definition).
   */
  static registerActions(actions) {
    for (const definition of SiteActions.definitions()) {
      actions.register(definition);
    }
  }

  /**
   * :return: Todas las definiciones, en el orden en que el agente debe conocerlas.
   */
  static definitions() {
    return [
      {
        name: "find_school_lists",
        description:
          "Busca las listas oficiales de útiles por colegio y grado (texto libre, sin tildes ni mayúsculas importa). Devuelve listId, colegio, grado y año; si no hay coincidencias, los colegios que sí tienen listas.",
        effect: "read",
        inputSchema: {
          type: "object",
          additionalProperties: false,
          properties: {
            colegio: { type: "string", maxLength: 120, description: "Nombre o parte del nombre del colegio." },
            grado: { type: "string", maxLength: 60, description: "Grado, por ejemplo: 2do primaria, inicial 5 años." },
          },
        },
        execute: (args) => page().findSchoolLists(args),
      },
      {
        name: "quote_list",
        description:
          "Cotiza una lista oficial en los paquetes económico, medio (Normal) y premium: total de cada uno y útiles que faltan. Los totales no incluyen envío ni servicios.",
        effect: "read",
        inputSchema: {
          type: "object",
          additionalProperties: false,
          required: ["listId"],
          properties: { listId: LIST_ID },
        },
        execute: (args) => page().quoteList(args),
      },
      {
        name: "search_products",
        description:
          "Busca productos del catálogo por texto, opcionalmente por categoría y precio máximo. Devuelve hasta 10 con productId, marca, precio de venta y stock.",
        effect: "read",
        inputSchema: {
          type: "object",
          additionalProperties: false,
          required: ["consulta"],
          properties: {
            consulta: { type: "string", minLength: 1, maxLength: 120, description: "Qué buscar, por ejemplo: témperas." },
            categoria: { type: "string", maxLength: 60, description: "Opcional: una categoría de website_get_store_info." },
            precioMaximo: { type: "number", minimum: 0, maximum: 10000, description: "Opcional: precio máximo en soles." },
          },
        },
        execute: (args) => page().searchProducts(args),
      },
      {
        name: "get_store_info",
        description:
          "Lee el costo y los días de envío, el monto para envío gratis, el horario, la cobertura, el WhatsApp y las categorías del catálogo.",
        effect: "read",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        execute: () => page().getStoreInfo(),
      },
      {
        name: "get_cart",
        description: "Lee el carrito del padre: líneas, pendientes y total. No incluye el envío.",
        effect: "read",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        execute: () => page().getCart(),
      },
      {
        name: "add_product_to_cart",
        description:
          "Agrega un producto al carrito. Úsalo solo cuando el padre lo pida. Devuelve el carrito, o ok false con el motivo.",
        effect: "write",
        inputSchema: {
          type: "object",
          additionalProperties: false,
          required: ["productId", "cantidad"],
          properties: {
            productId: { type: "string", minLength: 1, maxLength: 80, description: "El productId de website_search_products." },
            cantidad: { type: "integer", minimum: 1, maximum: 99 },
          },
        },
        execute: (args) => page().addProductToCart(args),
      },
      {
        name: "add_list_to_cart",
        description:
          "Agrega una lista oficial completa al carrito en el paquete elegido por el padre. Volver a agregarla reemplaza la anterior. Úsalo solo cuando el padre lo pida. Devuelve el carrito, o ok false con el motivo.",
        effect: "write",
        inputSchema: {
          type: "object",
          additionalProperties: false,
          required: ["listId", "nivel"],
          properties: {
            listId: LIST_ID,
            nivel: { type: "string", enum: ["economico", "medio", "premium"], description: "El paquete elegido." },
          },
        },
        execute: (args) => page().addListToCart(args),
      },
    ];
  }
}

// El runtime llama a la exportación registerActions del módulo.
export const registerActions = SiteActions.registerActions;
export const definitions = SiteActions.definitions;
