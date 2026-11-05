// Efectos de respuesta a acciones del usuario: el producto vuela al carrito y confeti al confirmar.
// Usan la Web Animations API y no hacen nada si el usuario pidió reducir el movimiento.

const sinMovimiento = () =>
  typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Lanza una miniatura desde `origen` hasta el ícono del carrito de la cabecera. */
export function volarAlCarrito(origen: Element | null | undefined, imagen?: string | null) {
  if (sinMovimiento() || !origen) return;
  const destino = Array.from(document.querySelectorAll<HTMLElement>('[data-carrito]')).find(el => el.offsetParent !== null);
  if (!destino) return;
  const a = origen.getBoundingClientRect();
  const b = destino.getBoundingClientRect();
  const lado = Math.min(72, Math.max(40, Math.min(a.width, a.height)));
  const x0 = a.left + a.width / 2 - lado / 2, y0 = a.top + a.height / 2 - lado / 2;
  const dx = b.left + b.width / 2 - lado / 2 - x0, dy = b.top + b.height / 2 - lado / 2 - y0;

  const el = document.createElement('div');
  el.setAttribute('aria-hidden', 'true');
  Object.assign(el.style, {
    position: 'fixed', left: `${x0}px`, top: `${y0}px`, width: `${lado}px`, height: `${lado}px`, zIndex: '9999',
    borderRadius: '14px', background: 'var(--t-superficie)', boxShadow: '0 10px 30px -8px rgba(0,0,0,.35)',
    border: '2px solid var(--t-acento)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'none', overflow: 'hidden',
  });
  if (imagen) {
    const img = document.createElement('img');
    img.src = imagen; img.alt = '';
    Object.assign(img.style, { width: '82%', height: '82%', objectFit: 'contain' });
    el.appendChild(img);
  } else {
    el.textContent = '+1';
    Object.assign(el.style, { font: '800 18px var(--font-sans)', color: 'var(--t-texto)' });
  }
  document.body.appendChild(el);

  // Arco: sube primero y luego cae en el carrito
  const alto = Math.min(-80, dy - 120);
  const anim = el.animate([
    { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
    { transform: `translate(${dx * 0.45}px, ${alto}px) scale(.9) rotate(-12deg)`, opacity: 1, offset: 0.45 },
    { transform: `translate(${dx}px, ${dy}px) scale(.25) rotate(8deg)`, opacity: 0.6 },
  ], { duration: 750, easing: 'cubic-bezier(.45,.05,.35,1)' });
  anim.onfinish = () => {
    el.remove();
    destino.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25) rotate(-8deg)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
  };
}

const COLORES = ['#2E62D9', '#F6A609', '#10B981', '#8B5CF6', '#EF4444', '#EC4899'];

/** Confeti de papel picado que cae desde arriba. */
export function lanzarConfeti(cantidad = 90) {
  if (sinMovimiento()) return;
  const capa = document.createElement('div');
  capa.setAttribute('aria-hidden', 'true');
  Object.assign(capa.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '9998', overflow: 'hidden' });
  document.body.appendChild(capa);
  const ancho = window.innerWidth, alto = window.innerHeight;
  let vivos = cantidad;
  for (let i = 0; i < cantidad; i++) {
    const p = document.createElement('span');
    const w = 6 + Math.random() * 7, h = w * (0.4 + Math.random() * 0.8);
    Object.assign(p.style, {
      position: 'absolute', left: `${Math.random() * ancho}px`, top: '-20px', width: `${w}px`, height: `${h}px`,
      background: COLORES[i % COLORES.length], borderRadius: Math.random() > 0.7 ? '50%' : '2px',
    });
    capa.appendChild(p);
    const deriva = (Math.random() - 0.5) * 260;
    const giro = (Math.random() - 0.5) * 1080;
    p.animate([
      { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
      { transform: `translate(${deriva}px, ${alto + 40}px) rotate(${giro}deg)`, opacity: 0.9 },
    ], { duration: 1800 + Math.random() * 1600, delay: Math.random() * 400, easing: 'cubic-bezier(.2,.6,.4,1)' }).onfinish = () => {
      p.remove();
      if (--vivos === 0) capa.remove();
    };
  }
}
