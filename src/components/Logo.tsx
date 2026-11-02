import Link from 'next/link';

/** Casilla marcada + "ready": la lista ya está completa. */
export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="2" y="4" width="24" height="24" rx="6" style={{ fill: 'var(--color-primario)' }} />
      <path d="M8.5 16.5l5 5L29 6" fill="none" style={{ stroke: 'var(--color-acento)' }} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-lg" aria-label="Ready, ir al inicio">
      <LogoMark />
      <span className={`text-[1.4rem] font-extrabold tracking-[-0.03em] ${light ? 'text-white' : 'text-grafito'}`}>
        ready
      </span>
    </Link>
  );
}
