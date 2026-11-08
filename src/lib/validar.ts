// Validaciones del pago y del perfil, con mensajes en español para mostrar junto a cada campo.

/** Deja solo los 9 dígitos de un celular peruano: "+51 987 654 321" → "987654321". */
export function limpiarCelular(v: string): string {
  let d = v.replace(/[\s\-().]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  if (d.length === 11 && d.startsWith('51')) d = d.slice(2);
  return d;
}

export function validarCelular(v: string): string | null {
  if (!v.trim()) return 'Escribe tu celular para coordinar la entrega.';
  const d = limpiarCelular(v);
  if (!/^\d+$/.test(d)) return 'El celular solo lleva números (puedes empezar con +51).';
  if (!/^9\d{8}$/.test(d)) return 'Escribe un celular de 9 dígitos que empiece con 9, por ejemplo 987 654 321.';
  return null;
}

export function validarCorreo(v: string): string | null {
  if (!v.trim()) return 'Escribe tu correo para enviarte la confirmación.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) return 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  return null;
}

export function validarDireccion(v: string): string | null {
  if (!v.trim()) return 'Escribe la dirección de entrega.';
  if (v.trim().length < 8) return 'Agrega más detalle: calle, número y distrito.';
  return null;
}

/** DNI opcional (boleta): si se escribe, 8 dígitos. */
export function validarDni(v: string, obligatorio = false): string | null {
  if (!v.trim()) return obligatorio ? 'Escribe el DNI.' : null;
  if (!/^\d{8}$/.test(v.trim())) return 'El DNI tiene 8 dígitos.';
  return null;
}

export function validarRuc(v: string): string | null {
  if (!v.trim()) return 'Escribe el RUC para la factura.';
  if (!/^\d{11}$/.test(v.trim())) return 'El RUC tiene 11 dígitos.';
  if (!/^(10|15|17|20)/.test(v.trim())) return 'El RUC empieza con 10 o 20.';
  return null;
}

export function validarRazonSocial(v: string): string | null {
  return v.trim().length < 3 ? 'Escribe la razón social de la empresa.' : null;
}

// ── Límites de longitud comunes (los mismos maxLength de los campos) ──
export const LARGO = {
  nombre: 80, correo: 120, clave: 72, celular: 16, direccion: 200, texto: 500, corto: 60, titulo: 120, url: 300, codigo: 40,
} as const;

/** Quita espacios de los extremos y junta los espacios repetidos del medio. */
export const limpiarTexto = (v: string) => v.trim().replace(/\s{2,}/g, ' ');

export function validarNombre(v: string, campo = 'tu nombre'): string | null {
  const t = limpiarTexto(v);
  if (!t) return `Escribe ${campo}.`;
  if (t.length < 2) return 'Escribe al menos 2 letras.';
  if (t.length > LARGO.nombre) return `Máximo ${LARGO.nombre} caracteres.`;
  if (/[<>{}]|https?:\/\//i.test(t)) return 'Escribe solo el nombre, sin enlaces ni símbolos.';
  return null;
}

/** Correo obligatorio con mensaje genérico (para registro e inicio de sesión). */
export function validarCorreoCuenta(v: string): string | null {
  if (!v.trim()) return 'Escribe tu correo.';
  if (v.trim().length > LARGO.correo) return `Máximo ${LARGO.correo} caracteres.`;
  return validarCorreo(v);
}

export function validarClave(v: string): string | null {
  if (!v) return 'Escribe una contraseña.';
  if (v.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (v.length > LARGO.clave) return `Máximo ${LARGO.clave} caracteres.`;
  return null;
}

/** 0 = vacía, 1 = débil, 2 = aceptable, 3 = fuerte. Pista simple para el registro. */
export function fuerzaClave(v: string): { nivel: 0 | 1 | 2 | 3; texto: string; pista: string } {
  if (!v) return { nivel: 0, texto: '', pista: 'Usa al menos 8 caracteres.' };
  if (v.length < 8) return { nivel: 1, texto: 'Muy corta', pista: `Te faltan ${8 - v.length} caracteres.` };
  const tipos = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(r => r.test(v)).length;
  if (v.length >= 12 && tipos >= 3) return { nivel: 3, texto: 'Fuerte', pista: '¡Buena contraseña!' };
  if (tipos >= 3 || v.length >= 12) return { nivel: 2, texto: 'Aceptable', pista: 'Para hacerla fuerte, usa 12 caracteres o más con mayúsculas, números y símbolos.' };
  return { nivel: 1, texto: 'Débil', pista: 'Mezcla mayúsculas, minúsculas, números o símbolos.' };
}

export function validarConfirmacion(clave: string, repetida: string): string | null {
  if (!repetida) return 'Repite la contraseña.';
  return clave === repetida ? null : 'Las contraseñas no coinciden.';
}

/** Celular opcional (perfil): si se escribe, 9 dígitos que empiezan con 9. */
export function validarCelularOpcional(v: string): string | null {
  return v.trim() ? validarCelular(v) : null;
}

/** DNI (8 dígitos) o RUC (11 dígitos), opcional. */
export function validarDocumento(v: string): string | null {
  const t = v.trim();
  if (!t) return null;
  if (!/^\d+$/.test(t)) return 'Solo números: DNI de 8 dígitos o RUC de 11.';
  if (t.length === 8) return null;
  if (t.length === 11) return validarRuc(t);
  return 'El DNI tiene 8 dígitos y el RUC 11.';
}

/** Texto obligatorio u opcional con largo mínimo y máximo. */
export function validarTexto(v: string, { campo = 'este dato', obligatorio = true, min = 1, max: maximo = LARGO.texto as number } = {}): string | null {
  const t = v.trim();
  if (!t) return obligatorio ? `Escribe ${campo}.` : null;
  if (t.length < min) return `Escribe al menos ${min} caracteres.`;
  if (t.length > maximo) return `Máximo ${maximo} caracteres (tienes ${t.length}).`;
  return null;
}

const aNumero = (v: string | number) => typeof v === 'number' ? v : Number(String(v).trim().replace(',', '.'));

/** Precio en soles: número mayor que 0 (o ≥ 0 si se permite gratis) con hasta 2 decimales. */
export function validarPrecio(v: string | number, { permitirCero = false, maximo = 99999 } = {}): string | null {
  if (String(v).trim() === '') return 'Escribe el precio.';
  const n = aNumero(v);
  if (!Number.isFinite(n)) return 'Escribe un precio válido, por ejemplo 12.50.';
  if (n < 0 || (!permitirCero && n === 0)) return permitirCero ? 'El precio no puede ser negativo.' : 'El precio debe ser mayor que 0.';
  if (n > maximo) return `El precio máximo es S/ ${maximo}.`;
  if (Math.round(n * 100) !== +(n * 100).toFixed(6)) return 'Usa como máximo 2 decimales.';
  return null;
}

/** Número entero dentro de un rango (stock, cantidad, orden, días). */
export function validarEntero(v: string | number, { campo = 'la cantidad', min = 0, max: maximo = 99999 } = {}): string | null {
  if (String(v).trim() === '') return `Escribe ${campo}.`;
  const n = aNumero(v);
  if (!Number.isInteger(n)) return `${campo.charAt(0).toUpperCase() + campo.slice(1)} debe ser un número entero.`;
  if (n < min) return `El mínimo es ${min}.`;
  if (n > maximo) return `El máximo es ${maximo}.`;
  return null;
}

export function validarPorcentaje(v: string | number, { obligatorio = true } = {}): string | null {
  if (String(v).trim() === '') return obligatorio ? 'Escribe el porcentaje.' : null;
  const n = aNumero(v);
  if (!Number.isFinite(n)) return 'Escribe un número.';
  if (n < 0 || n > 100) return 'El porcentaje va de 0 a 100.';
  return null;
}

/** Enlace opcional: ruta interna (/catalog) o dirección web http(s). */
export function validarEnlace(v: string): string | null {
  const t = v.trim();
  if (!t) return null;
  if (t.length > LARGO.url) return `Máximo ${LARGO.url} caracteres.`;
  if (t.startsWith('/') && !t.startsWith('//')) return null;
  try { const u = new URL(t); return u.protocol === 'https:' || u.protocol === 'http:' ? null : 'El enlace debe empezar con https://'; }
  catch { return 'Escribe un enlace válido: /catalog o https://…'; }
}

// ── Tarjeta (pago de prueba) ──
/** Algoritmo de Luhn: detecta números de tarjeta mal escritos. */
export function luhn(numero: string): boolean {
  const d = numero.replace(/\D/g, '');
  let suma = 0;
  for (let i = 0; i < d.length; i++) {
    let x = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) { x *= 2; if (x > 9) x -= 9; }
    suma += x;
  }
  return d.length > 0 && suma % 10 === 0;
}

export function validarTarjeta(v: string): string | null {
  const d = v.replace(/\D/g, '');
  if (!d) return 'Escribe el número de la tarjeta.';
  if (d.length < 15 || d.length > 16) return 'El número de tarjeta tiene 16 dígitos.';
  if (!luhn(d)) return 'Revisa el número: parece que hay un dígito mal escrito.';
  return null;
}

/** Vencimiento MM/AA, no vencida. */
export function validarVencimiento(v: string, hoy = new Date()): string | null {
  if (!v.trim()) return 'Escribe el vencimiento (MM/AA).';
  const m = /^(\d{2})\/(\d{2})$/.exec(v.trim());
  if (!m) return 'Usa el formato MM/AA, por ejemplo 08/29.';
  const mes = Number(m[1]), año = 2000 + Number(m[2]);
  if (mes < 1 || mes > 12) return 'El mes va de 01 a 12.';
  if (año < hoy.getFullYear() || (año === hoy.getFullYear() && mes < hoy.getMonth() + 1)) return 'La tarjeta está vencida.';
  return null;
}

export function validarCvv(v: string): string | null {
  if (!v) return 'Escribe el CVV.';
  return /^\d{3,4}$/.test(v) ? null : 'El CVV tiene 3 o 4 dígitos (atrás de la tarjeta).';
}

/** Primer campo con error de un objeto de errores, en el orden en que se definieron. */
export const primerError = <K extends string>(errores: Partial<Record<K, string | null | undefined>>): K | undefined =>
  (Object.keys(errores) as K[]).find(k => errores[k]);

/** Lleva el foco (y la vista) al campo con ese id. */
export function enfocar(id: string | undefined, raiz: ParentNode | null = typeof document !== 'undefined' ? document : null) {
  if (!id || !raiz) return;
  const el = raiz.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
  if (!el) return;
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

/** aria-invalid y aria-describedby de un campo según su error. */
export const ariaCampo = (id: string, error?: string | null, ayuda?: boolean) => ({
  'aria-invalid': error ? true : undefined,
  'aria-describedby': error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined,
});
