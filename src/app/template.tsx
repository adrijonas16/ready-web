/** Se vuelve a montar en cada navegación: entrada suave de la página nueva. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-entrada-pagina">{children}</div>;
}
