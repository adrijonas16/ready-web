---
name: agregar-accion-asistente
description: Agrega o cambia una acción website_* del asistente "Pregúntale a Ready" (web agéntica) de punta a punta. Úsala cuando pidan que el asistente pueda hacer algo nuevo (cupones, seguir pedidos, recomendar productos…) o cambiar lo que una acción devuelve.
---

# Agregar una acción al asistente de Ready

Lee primero `docs/web-agentica.md` y, para decidir el efecto, la referencia oficial
`.claude/skills/agentify-website/references/site_actions.md`.

## 0. Decide si de verdad hace falta

- ¿Lo puede responder una acción existente? Mejora su resultado en vez de agregar otra: cada
  acción suma su descripción y esquema a **cada** llamada al modelo.
- ¿Cuál es su efecto?
  - `read`: no cambia nada.
  - `write`: cambia algo que el padre puede deshacer en la página (el carrito).
  - `irreversible`: crea pedidos, cobra, cancela, envía mensajes. **Para y avisa**: necesita
    función de chequeo previo, diálogo de confirmación en el arranque (`src/agentic/arranque.ts`,
    ver `templates/site.js` de la skill: `DIALOGS`, `reviewDetails`) y, si depende del carrito,
    un contador de versión. No lo hagas sin que la persona lo pida explícitamente.

## 1. Lógica en `src/agentic/ready-page.ts`

Agrega un método a `ReadyPage`:
- Recibe un objeto JSON simple y devuelve JSON simple (nada de objetos vivos, `Date`, clases).
- Valida **todo** antes de cambiar algo. Si algo está mal: `return rechazo('motivo claro', 'campo')`.
- Usa las funciones de la tienda (`src/services/api.ts`, `src/lib/precio.ts`, `src/lib/lista.ts`,
  `Paquetes.tsx`). Nunca recalcules precios a mano.
- Si cambia el carrito: guarda `const antes = this.cart()`, haz el cambio y
  `await this.carritoTrasCambio(antes)` antes de devolver `this.getCart()`.
- Debe funcionar en modo demo: si llamas a un endpoint nuevo, agrégalo a `src/demo/servidor.ts`.

## 2. Definición en `public/site-actions.js`

Agrega a `definitions()` (en el orden en que el agente debe conocerlas):

```js
{
  name: "nombre_en_snake_case",          // el modelo verá website_nombre_en_snake_case
  description: "Qué hace y qué devuelve, en una o dos frases. Si escribe: 'Úsalo solo cuando el padre lo pida.'",
  effect: "read",                         // read | write | irreversible
  inputSchema: { type: "object", additionalProperties: false, required: [...], properties: {...} },
  execute: (args) => page().nombreDelMetodo(args),
},
```

El esquema usa solo palabras clave que acepta el runtime (`runtime/actions.js`): `type`,
`properties`, `required`, `additionalProperties: false`, `enum`, `minLength`, `maxLength`,
`minimum`, `maximum`, `items`, `minItems`, `maxItems`, `description`. Limita longitudes y rangos.

## 3. Publícala

- Agrega el nombre (sin `website_`) a `actions.agentTools` en `public/agent-manifest.json`.
- Menciónala en las instrucciones de `ready_desk` en `agent/ready_utiles.hocon`
  ("Para X, llama a website_nombre…"). Si el asistente ya no "no puede" algo, quítalo de la
  línea "This assistant cannot…" en `grounding_rules`.
- `npm run agente:build`. Debe terminar en `OK` y **sin** `WARNING` (avisa de herramientas sin
  mencionar, nombres que no existen o instrucciones de más de 5000 caracteres).

## 4. Pruébala

- En `tests/asistente.test.ts`: un caso que funciona, un rechazo sin cambios y, si escribe, que
  el resultado coincide con lo que mostraría la página. `npm test`.
- `npx tsc --noEmit` y `npm run lint` (sin errores nuevos).
- Prueba el flujo en el navegador sin clave de IA: skill `probar-asistente`.

## 5. Documenta

Agrega la fila a la tabla de acciones de `docs/web-agentica.md`.
