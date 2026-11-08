import { metadatosPagina } from '@/lib/sitio';

export const metadata = metadatosPagina({
  titulo: 'Pagar pedido',
  descripcion: 'Dirección de entrega, fecha, comprobante y pago de tu pedido.',
  ruta: '/checkout',
  privada: true,
});

/** Solo metadatos: la página es un componente de cliente. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
