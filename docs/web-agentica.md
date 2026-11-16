# Ready en la web agéntica abierta

Ready es un **sitio agéntico**: publica una red de agentes de IA que el navegador del
visitante ejecuta con su propia clave, y que otros sitios agénticos también pueden consultar.
El visitante la ve como el botón **"Pregúntale a Ready"**.

Se construyó siguiendo la skill oficial del [Open Agentic Web Challenge](https://github.com/cognizant-ai-labs/agentic-web),
copiada en [`.claude/skills/agentify-website/`](../.claude/skills/agentify-website/SKILL.md), y se
diseñó primero en [Telar](https://adrijonas16.github.io/telar/).

## Qué puede hacer el asistente

| Acción (`website_*`) | Efecto | Qué hace |
| --- | --- | --- |
| `find_school_lists` | lectura | Busca listas oficiales por colegio y grado (sin importar tildes ni mayúsculas) |
| `quote_list` | lectura | Cotiza una lista en los paquetes económico, medio (Normal) y premium |
| `search_products` | lectura | Busca productos por texto, categoría y precio máximo |
| `get_store_info` | lectura | Envío (costo, días, envío gratis, cobertura), WhatsApp, categorías |
| `get_cart` | lectura | El carrito del padre |
| `add_product_to_cart` | escritura | Agrega un producto (solo si el padre lo pide) |
| `add_list_to_cart` | escritura | Agrega una lista completa en un paquete (reemplaza la anterior, no duplica) |

**Lo que NO hace, a propósito:** crear o pagar pedidos, aplicar cupones, seguir pedidos,
agregar forrado, etiquetas o libros, ni leer la foto de una lista. El padre confirma el pedido
en `/cart`. Si algún día una acción crea pedidos, debe declararse `irreversible` (el runtime
mostrará un diálogo de confirmación): lee `references/site_actions.md` de la skill antes.

## Mapa de archivos

```
agent/ready_utiles.hocon          ← FUENTE de la red: prompts e instrucciones del agente
public/
  agent-manifest.json             ← manifiesto del sitio (red, router de IA, acciones)
  ready_utiles.network.json       ← GENERADO desde el .hocon (no editar a mano)
  site-actions.js                 ← las 7 acciones website_*: envuelven ReadyPage
  links.json, agent-mcp.json      ← enlaces y descubrimiento (generados/plantilla)
  .well-known/, bridge/           ← GENERADOS por build_network.mjs
  runtime/                        ← runtime oficial, COPIA SIN CAMBIOS de la skill
src/agentic/
  ready-page.ts                   ← ReadyPage: la lógica de cada acción (API + carrito)
  arranque.ts                     ← arranca el runtime en #agent-app
  asistente.css                   ← estilos del chat (paleta de la tienda)
src/components/AsistenteReady.tsx ← botón y panel; registra globalThis.readyPage
next.config.ts                    ← CSP (proveedores de IA) y CORS de los archivos públicos
tests/asistente.test.ts           ← pruebas de acciones con el runtime oficial
.claude/skills/agentify-website/  ← skill oficial (procedimiento, plantillas, scripts, runtime)
.claude/skills/agregar-accion-asistente/ ← skill propia: agregar una acción de punta a punta
.claude/skills/probar-asistente/  ← skill propia: probar el asistente sin clave de IA
```

## Cómo funciona

```
Padre ── chat ──► runtime (public/runtime, en su navegador, con SU clave de IA)
                     │ lee agent-manifest.json → ready_utiles.network.json (instrucciones)
                     │ importa site-actions.js → herramientas website_*
                     ▼
         website_quote_list(...) ──► globalThis.readyPage (ReadyPage)
                                        ├─► listsApi / productsApi / settingsApi
                                        │      (modo demo: src/demo/servidor.ts)
                                        └─► carrito (useCart vía AsistenteReady)
```

- `ReadyPage` usa **las mismas funciones que la página** (`totalPaquete`, `faltantes`,
  `tierProduct`, `replaceList`), así el asistente nunca calcula precios distinto.
- Funciona igual en **modo demo** (por defecto) y con la API real (.NET).
- El runtime pesa ~2 MB y se descarga **solo al abrir el asistente**.
- Otros sitios pueden llamar a `https://<dominio>/ready_utiles`: reciben las instrucciones
  pero **no** las acciones (todas son de esta página). La "peer rule" del agente cubre ese caso.

## Tareas comunes

| Quiero… | Haz esto |
| --- | --- |
| Cambiar lo que dice o cómo se comporta el asistente | Edita las líneas propias de Ready en `agent/ready_utiles.hocon` y corre `npm run agente:build`. No cambies los textos de la plantilla (grounding, peer, cruse). |
| Agregar una acción (ej. cupones) | Sigue la skill `.claude/skills/agregar-accion-asistente/SKILL.md` |
| Actualizar el runtime oficial | Actualiza `.claude/skills/agentify-website` desde el repo del reto y corre `npm run agente:runtime && npm run agente:build` |
| Agregar un proveedor de IA propio | Agrega su origen a `PROVEEDORES_IA` en `next.config.ts` |
| Probar sin clave de IA | Skill `.claude/skills/probar-asistente/SKILL.md` |

## Comandos

```sh
npm run agente:build    # compila agent/ready_utiles.hocon → public/ (script oficial)
npm run agente:check    # revisa sin escribir (lo corre la CI)
npm run agente:runtime  # copia el runtime de la skill a public/runtime
npm test                # pruebas de las acciones (vitest, modo demo)
```

## Seguridad

- La clave de IA es **del visitante** y se guarda en su navegador. La tienda no paga ni ve
  las conversaciones. Nunca pongas claves en el `.hocon`: todo lo publicado es público.
- `connect-src` de la CSP permite solo los 5 proveedores del runtime (Otari, Gemini, Groq,
  OpenAI, Anthropic). CORS abierto **solo** en los archivos públicos de agentes, nunca en la API.
- `runtime/sandbox-worker.js` se sirve con su propia CSP (sin red), como pide la guía oficial.
- Las escrituras validan todo antes de cambiar nada y devuelven `{ok:false, reason, field}`.

## Límites conocidos

- Las acciones `write` del runtime oficial se ejecutan sin vista previa (spec §3.1); aquí solo
  cambian el carrito, que el padre revisa antes de pagar.
- Solo la última respuesta de herramienta de cada turno queda en el historial: el agente
  vuelve a leer datos en cada turno (sus instrucciones se lo piden).
- Proveedores de IA fuera de la lista de la CSP no funcionan hasta agregarlos.
