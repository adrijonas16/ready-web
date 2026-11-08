'use client';

import { useEffect } from 'react';

// La primera carga del documento no se anima (así el contenido principal se pinta de inmediato,
// sin esperar el fundido); solo las navegaciones dentro de la tienda tienen la entrada suave.
let primeraCarga = true;

/** Se vuelve a montar en cada navegación: entrada suave de la página nueva. */
export default function Template({ children }: { children: React.ReactNode }) {
  const animar = !primeraCarga;
  useEffect(() => { primeraCarga = false; }, []);
  return <div className={animar ? 'animate-entrada-pagina' : undefined}>{children}</div>;
}
