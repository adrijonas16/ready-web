import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Pruebas de la web agéntica (tests/). Corren en Node contra el servidor de demostración
// (src/demo/servidor.ts), igual que la tienda en modo demo: sin backend ni red.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  esbuild: { jsx: "automatic" },
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
});
