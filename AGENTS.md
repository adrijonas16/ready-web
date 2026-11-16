# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Ready: guía para agentes de código y colaboradores

Tienda de útiles escolares en Arequipa (Perú). Frontend Next.js 16 (App Router, React 19,
Tailwind 4). El backend (.NET + SignalR) vive en otro repositorio (`adrijonas16/ready`).

## Comandos

```sh
npm run dev            # desarrollo (modo demo por defecto: sin backend)
npm run build          # compilación de producción
npm run lint           # ESLint (hay advertencias previas de <img>; no agregues errores)
npx tsc --noEmit       # tipos
npm test               # pruebas del asistente (vitest)
npm run agente:build   # compila la red del asistente (ver abajo)
npm run agente:check   # la CI lo corre: falla si public/ no está al día
```

## Convenciones

- **Idioma:** código, nombres y comentarios en español (`precioVenta`, `listaId`), salvo APIs
  externas. Textos visibles en español peruano, con "tú".
- **Modo demo:** `NEXT_PUBLIC_MODO_DEMO` distinto de `"false"` hace que `src/demo/servidor.ts`
  responda en el navegador todo lo que pide `src/services/api.ts`. Toda función nueva debe
  funcionar en ambos modos; si agregas un endpoint, agrégalo también al servidor de demo.
- **Precios:** usa siempre `precioVenta`, `redondear` (`src/lib/precio.ts`) y las funciones de
  `src/lib/lista.ts` y `src/components/lista/Paquetes.tsx`. Nunca recalcules precios a mano.
- **Seguridad:** la CSP está en `next.config.ts`. No agregues orígenes sin explicar por qué en
  un comentario. Nunca subas secretos (la CI corre gitleaks con `.gitleaks.toml`).

## Web agéntica: el asistente "Pregúntale a Ready"

Lee **`docs/web-agentica.md`** antes de tocar algo de esto. Resumen de reglas:

1. **Fuente de verdad del agente:** `agent/ready_utiles.hocon`. No edites
   `public/ready_utiles.network.json`, `public/.well-known/`, `public/bridge/` ni
   `public/agent-mcp.json` a mano: los genera `npm run agente:build`.
2. **No modifiques `public/runtime/` ni `.claude/skills/agentify-website/`**: son copias sin
   cambios del runtime y la skill oficiales (Apache-2.0). Se actualizan copiando la versión nueva.
3. **Cada acción = un método de `ReadyPage`** (`src/agentic/ready-page.ts`) + una definición en
   `public/site-actions.js` + su nombre en `agentTools` de `public/agent-manifest.json` + su
   mención en las instrucciones del `.hocon` + una prueba en `tests/asistente.test.ts`.
   La skill `.claude/skills/agregar-accion-asistente` tiene el procedimiento completo.
4. **Rechaza devolviendo, no lanzando:** entrada inválida → `{ok:false, reason, field}` sin
   cambiar nada. `throw` solo para fallos inesperados (el runtime los marca "desconocido").
5. **Efectos honestos:** `read` no cambia nada; `write` se puede deshacer en la página (el
   carrito); `irreversible` (pedidos, pagos, cancelaciones) exige diálogo de confirmación y una
   función de chequeo previo: lee `references/site_actions.md` de la skill antes de agregar una.
6. **El asistente no crea ni paga pedidos.** El padre confirma en `/cart`.
7. **Instrucciones del agente:** cambia solo las líneas propias de Ready; los bloques
   `grounding_rules`, `peer_rules` y `cruse_rules` vienen de la plantilla oficial. Presupuesto:
   5000 caracteres (el build avisa si te pasas).
8. **Prueba sin clave de IA** con la skill `.claude/skills/probar-asistente` antes de abrir un PR
   que toque el asistente.
