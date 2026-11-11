import type { School } from '@/lib/types';
import type { SelectOption } from '@/components/SearchSelect';
import { BASE } from '@/lib/peru';

/**
 * Opciones de colegio para los buscadores: el nombre y, debajo, el distrito (hay muchos "I.E. 0001 …" en
 * Lima). El departamento solo se muestra si hay colegios de más de uno. Se encuentran también por distrito.
 */
export function opcionesColegios(colegios: School[]): SelectOption[] {
  const varios = new Set(colegios.map(c => c.departamento ?? BASE)).size > 1;
  return colegios.map(c => {
    const dep = c.departamento ?? BASE;
    const lugar = [c.distrito && c.distrito !== dep ? c.distrito : null, varios ? dep : null].filter(Boolean).join(', ');
    return { value: c.id, label: c.name, ...(lugar ? { detalle: lugar } : {}), buscar: [c.distrito, c.provincia, dep].filter(Boolean).join(' ') };
  });
}

