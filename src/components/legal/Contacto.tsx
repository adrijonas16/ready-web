'use client';

import { enlaceWhatsapp, useAjustes } from '@/lib/ajustes';

/** Datos de contacto de la tienda (GET /settings): WhatsApp, teléfono y horario. */
export default function Contacto() {
  const a = useAjustes();
  return (
    <ul>
      <li>WhatsApp: <a href={enlaceWhatsapp(a.whatsapp)} target="_blank" rel="noopener noreferrer">+{a.whatsapp.replace(/^51/, '51 ')}</a></li>
      <li>Teléfono: <a href={`tel:+51${a.telefono.replace(/\D/g, '')}`}>{a.telefono}</a></li>
      <li>Horario de atención: {a.horarioEntrega}</li>
      <li>Correo: [correo de contacto por definir]</li>
    </ul>
  );
}
