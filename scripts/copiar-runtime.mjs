// Copia el runtime oficial de la web agéntica desde la skill a public/runtime, sin cambios.
// Úsalo al actualizar la skill (.claude/skills/agentify-website): `npm run agente:runtime`.
import { cpSync, rmSync } from "node:fs";

const origen = ".claude/skills/agentify-website/runtime";
const destino = "public/runtime";
rmSync(destino, { recursive: true, force: true });
cpSync(origen, destino, { recursive: true });
console.log(`Runtime copiado: ${origen} -> ${destino}`);
