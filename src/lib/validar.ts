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
