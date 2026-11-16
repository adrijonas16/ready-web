"""Prueba de punta a punta de "Pregúntale a Ready" con un modelo de guion (sin clave de IA).

Uso:  python guion.py [URL]     (por defecto http://localhost:3000)

Intercepta las llamadas al proveedor de IA (api.otari.ai, el router por defecto) y responde
como un modelo compatible con OpenAI que llama a las acciones website_* REALES. Los números
que muestra el chat salen de los resultados de esas acciones. Termina con código 1 si algo
falla. Capturas en ./prueba-asistente/.
"""
import asyncio
import json
import os
import pathlib
import sys

from playwright.async_api import async_playwright

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from modelo_guion import HEADERS, text, tool_call  # noqa: E402

URL = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000").rstrip("/")
SALIDA = pathlib.Path("prueba-asistente")
P1 = "Hola, busco la lista de 2do de primaria del Colegio Los Álamos. ¿Cuánto me sale?"
P2 = "Agrégala en el paquete económico, por favor."

traza: list[str] = []
memoria: dict = {}


def resultado(contenido: str) -> dict:
    """El runtime envuelve el resultado de una acción como {status, result}."""
    try:
        d = json.loads(contenido)
    except (TypeError, ValueError):
        return {}
    return d.get("result", d) if isinstance(d, dict) else {}


async def modelo(route):
    pedido = json.loads(route.request.post_data or "{}")
    msgs = pedido.get("messages", [])
    usuarios = [i for i, m in enumerate(msgs) if m.get("role") == "user"]
    ultimo = str(msgs[usuarios[-1]]["content"]) if usuarios else ""
    herramientas = [m for m in msgs[usuarios[-1]:] if m.get("role") == "tool"] if usuarios else []

    if "busco la lista" in ultimo:
        if not herramientas:
            traza.append("→ website_find_school_lists")
            cuerpo = tool_call("website_find_school_lists", {"colegio": "Los Álamos", "grado": "2do primaria"})
        elif len(herramientas) == 1:
            r = resultado(herramientas[0]["content"])
            memoria["listId"] = r["listas"][0]["listId"]
            traza.append(f"← {len(r['listas'])} lista(s); → website_quote_list {memoria['listId']}")
            cuerpo = tool_call("website_quote_list", {"listId": memoria["listId"]})
        else:
            q = resultado(herramientas[1]["content"])
            memoria["cotizacion"] = q
            traza.append("← " + ", ".join(f"{p['nombre']} S/ {p['total']:.2f}" for p in q["paquetes"]))
            filas = "\n".join(f"| {p['nombre']} | S/ {p['total']:.2f} | {', '.join(p['faltan']) or '—'} |" for p in q["paquetes"])
            cuerpo = text(f"Lista de **{q['grado']}** del **{q['colegio']}** ({q['utiles']} útiles):\n\n"
                          f"| Paquete | Total | Faltan |\n|---|---|---|\n{filas}\n\nSin envío ni forrado. ¿Cuál quieres?")
    elif "Agrégala" in ultimo:
        if not herramientas:
            traza.append("→ website_add_list_to_cart economico")
            cuerpo = tool_call("website_add_list_to_cart", {"listId": memoria["listId"], "nivel": "economico"})
        else:
            c = resultado(herramientas[0]["content"])
            memoria["carrito"] = c
            traza.append(f"← carrito S/ {c['total']:.2f}")
            cuerpo = text(f"Listo: tu carrito suma **S/ {c['total']:.2f}** (sin envío). Confirma el pedido en el carrito.")
    else:
        cuerpo = text("Hola")  # llamadas de verificación del runtime
    await route.fulfill(status=200, headers=HEADERS, body=cuerpo)


async def main() -> int:
    SALIDA.mkdir(exist_ok=True)
    errores: list[str] = []
    async with async_playwright() as p:
        # CHROME=/ruta/a/chrome usa un navegador instalado en vez del de Playwright
        chrome = os.environ.get("CHROME")
        navegador = await p.chromium.launch(**({"executable_path": chrome, "args": ["--no-sandbox"]} if chrome else {}))
        ctx = await navegador.new_context(viewport={"width": 1440, "height": 900})
        pg = await ctx.new_page()
        pg.on("pageerror", lambda e: errores.append(str(e)))
        pg.on("console", lambda m: errores.append(m.text) if m.type == "error" and "agent-manifest" not in m.text else None)
        await ctx.route("https://api.otari.ai/**", modelo)

        await pg.goto(URL + "/")
        await pg.wait_for_timeout(2000)
        boton = pg.get_by_role("button", name="Pregúntale a Ready")
        await boton.click()
        await pg.wait_for_timeout(3500)
        if not await pg.locator("#ns-key").is_visible():
            await pg.locator("#agent-app").get_by_text("AI model settings").first.click()
        await pg.fill("#ns-key", "clave_falsa_de_prueba")
        await pg.click("#ns-apply")  # recarga la página
        await pg.wait_for_timeout(3000)
        if await pg.locator("#asistente-ready").is_hidden():
            await boton.click()
            await pg.wait_for_timeout(3500)

        for i, pregunta in enumerate([P1, P2], start=1):
            await pg.fill("#ns-input", pregunta)
            await pg.click("#ns-send")
            await pg.wait_for_timeout(7000)
            await pg.screenshot(path=str(SALIDA / f"{i}-chat.png"))

        await pg.goto(URL + "/cart")
        await pg.wait_for_timeout(2500)
        await pg.screenshot(path=str(SALIDA / "3-carrito.png"))
        await navegador.close()

    print("Traza:", *traza, sep="\n  ")
    problemas = list(errores)
    cot, car = memoria.get("cotizacion"), memoria.get("carrito")
    if not cot or not car:
        problemas.append("El flujo no llegó al final (revisa las capturas).")
    elif abs(car["total"] - cot["paquetes"][0]["total"]) > 0.01:
        problemas.append(f"El carrito (S/ {car['total']}) no coincide con la cotización económica (S/ {cot['paquetes'][0]['total']}).")
    if problemas:
        print("FALLÓ:", *problemas, sep="\n  ")
        return 1
    print(f"OK: cotización y carrito coinciden. Capturas en {SALIDA}/")
    return 0


sys.exit(asyncio.run(main()))
