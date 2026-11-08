// Dibujos SVG de la tienda de demostración, como archivos estáticos (se generan al compilar).
import { dibujos } from '@/demo/catalogo';

export const dynamicParams = false;

export function generateStaticParams() {
  return [...dibujos.keys()].map(k => ({ archivo: `${k}.svg` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ archivo: string }> }) {
  const { archivo } = await params;
  const svg = dibujos.get(archivo.replace(/\.svg$/, ''));
  if (!svg) return new Response('No encontrado', { status: 404 });
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      // La dirección cambia si cambia el dibujo: se puede guardar por mucho tiempo
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
