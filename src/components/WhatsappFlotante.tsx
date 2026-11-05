'use client';

import { usePathname } from 'next/navigation';
import { useAjustes, enlaceWhatsapp } from '@/lib/ajustes';

// Páginas con barra fija abajo en el celular: el botón sube para no taparla
const CON_BARRA = [/^\/lists\/[^/]+$/, /^\/cart$/, /^\/checkout$/];

/** Botón flotante para escribir a la tienda por WhatsApp (no se muestra en el panel de administración). */
export default function WhatsappFlotante() {
  const pathname = usePathname() ?? '/';
  const { whatsapp } = useAjustes();
  if (!whatsapp || pathname.startsWith('/admin')) return null;
  const conBarra = CON_BARRA.some(r => r.test(pathname));
  const texto = pathname.startsWith('/orders/')
    ? `Hola, tengo una consulta sobre mi pedido ${pathname.split('/')[2]}`
    : 'Hola, tengo una consulta sobre los útiles escolares';
  return (
    <a href={enlaceWhatsapp(whatsapp, texto)} target="_blank" rel="noreferrer" aria-label="Escríbenos por WhatsApp" title="Escríbenos por WhatsApp"
      className={`fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_28px_-8px_rgba(0,0,0,0.45)] transition-transform hover:scale-105 focus-visible:scale-105 motion-reduce:transition-none print:hidden sm:right-6 ${conBarra ? 'bottom-24 lg:bottom-6' : 'bottom-5 sm:bottom-6'}`}>
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
        <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.04 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.94.95-3.48-.22-.36a9.43 9.43 0 1 1 7.99 4.41zm8.02-17.45A11.33 11.33 0 0 0 12.04.72C5.79.72.7 5.8.7 12.06c0 2 .52 3.95 1.52 5.67L.6 23.62l6.03-1.58a11.33 11.33 0 0 0 5.41 1.38h.01c6.25 0 11.34-5.09 11.34-11.35 0-3.03-1.18-5.88-3.33-8.02z" />
      </svg>
    </a>
  );
}
