---
name: probar-asistente
description: Prueba el asistente "Pregúntale a Ready" de punta a punta en un navegador, sin clave de IA real, con un modelo de guion que llama a las acciones website_* reales. Úsala antes de abrir un PR que toque el asistente, o para grabar una demo.
---

# Probar el asistente sin clave de IA

El runtime habla con el proveedor de IA por una API compatible con OpenAI
(`POST {router}/chat/completions` con `stream: true`). En una prueba, el navegador intercepta
esa llamada y responde un **modelo de guion**: decide qué herramienta llamar y arma la
respuesta **con los resultados reales** de las acciones. Así se prueba todo lo demás de verdad:
el runtime, las acciones, el carrito, los precios y la interfaz. Solo el texto del "modelo" es
simulado; dilo siempre al mostrar resultados.

## Pasos

1. Compila y levanta la tienda en modo demo:
   ```sh
   npm run agente:check && npm run build && npx next start -p 3000
   ```
2. Corre el guion (necesita Python con Playwright y un Chrome/Chromium):
   ```sh
   pip install playwright && python -m playwright install chromium   # una vez
   python .claude/skills/probar-asistente/scripts/guion.py http://localhost:3000
   ```
   Hace: abrir el asistente → poner una clave falsa → "busco la lista de 2do de primaria del
   Colegio Los Álamos" → `find_school_lists` → `quote_list` → tabla con los 3 totales reales →
   "agrégala en el paquete económico" → `add_list_to_cart` → revisa `/cart`. Imprime la traza de
   llamadas, guarda capturas en `./prueba-asistente/` y falla si hay errores en la consola o si
   el total del carrito no coincide con la cotización.
3. Revisa las capturas. Comprueba en especial que el panel no quede tapado por la cabecera y
   que el total del carrito sea el del paquete elegido.

## Cosas que ya se aprendieron (no las repitas)

- El runtime **no conserva** los resultados de herramientas de turnos anteriores: un guion (o el
  agente) debe guardar o volver a pedir los ids en cada turno.
- Después de escribir en el carrito, el estado de React se actualiza en el siguiente render:
  `ReadyPage` espera con `carritoTrasCambio` antes de leerlo. Sin eso devuelve un carrito viejo.
- "Save and start" en la configuración del runtime recarga la página: vuelve a abrir el panel.
- Si al probar ves estilos o scripts con MIME `text/plain`, quedó vivo un `next start` viejo con
  otra compilación: mátalo (`pkill -f next-server`) y vuelve a levantarlo.

## Con un modelo real

Abre el asistente, en "AI model settings" elige un proveedor y pega tu clave (mejor una con
límite de gasto bajo). El modelo por defecto está en `agent/ready_utiles.hocon` (`llm_config`).
