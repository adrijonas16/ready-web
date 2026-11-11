import type { Settings } from '@/lib/types';

/** Departamento donde empezó la tienda. Mientras el envío nacional esté apagado, solo se vende aquí. */
export const BASE = 'Arequipa';

/** Los 24 departamentos y el Callao (los mismos de backend/UtilesApi/Services/Cobertura.cs). */
export const DEPARTAMENTOS = [
  'Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca', 'Callao', 'Cusco',
  'Huancavelica', 'Huánuco', 'Ica', 'Junín', 'La Libertad', 'Lambayeque', 'Lima', 'Loreto',
  'Madre de Dios', 'Moquegua', 'Pasco', 'Piura', 'Puno', 'San Martín', 'Tacna', 'Tumbes', 'Ucayali',
] as const;
export type Departamento = (typeof DEPARTAMENTOS)[number];

/** Centro de la capital de cada departamento, para abrir el mapa cerca de la entrega. */
export const CENTROS: Record<Departamento, [number, number]> = {
  Amazonas: [-6.2317, -77.8690], 'Áncash': [-9.5278, -77.5278], 'Apurímac': [-13.6339, -72.8814],
  Arequipa: [-16.4090, -71.5375], Ayacucho: [-13.1588, -74.2232], Cajamarca: [-7.1638, -78.5003],
  Callao: [-12.0566, -77.1181], Cusco: [-13.5320, -71.9675], Huancavelica: [-12.7861, -74.9760],
  'Huánuco': [-9.9306, -76.2422], Ica: [-14.0678, -75.7286], 'Junín': [-12.0651, -75.2049],
  'La Libertad': [-8.1116, -79.0287], Lambayeque: [-6.7714, -79.8409], Lima: [-12.0464, -77.0428],
  Loreto: [-3.7491, -73.2538], 'Madre de Dios': [-12.5933, -69.1891], Moquegua: [-17.1956, -70.9353],
  Pasco: [-10.6864, -76.2625], Piura: [-5.1945, -80.6328], Puno: [-15.8402, -70.0219],
  'San Martín': [-6.0342, -76.9717], Tacna: [-18.0066, -70.2463], Tumbes: [-3.5669, -80.4515],
  Ucayali: [-8.3791, -74.5539],
};

/** Ciudad de Arequipa (el mapa no deja salir de aquí mientras solo se entregue en Arequipa). */
export const LIMITES_AREQUIPA: [[number, number], [number, number]] = [[-16.55, -71.65], [-16.25, -71.40]];
/** Todo el Perú, con un margen. */
export const LIMITES_PERU: [[number, number], [number, number]] = [[-18.6, -81.6], [0.2, -68.4]];

const clave = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '').toLowerCase();

/** Nombre oficial ("cusco" → "Cusco"), o null si no es un departamento. */
export function normalizarDepartamento(texto?: string | null): Departamento | null {
  if (!texto?.trim()) return null;
  const k = clave(texto);
  return DEPARTAMENTOS.find(d => clave(d) === k) ?? null;
}

/** ¿La tienda vende/entrega ahí con la configuración actual? */
export function atiende(s: Pick<Settings, 'coberturaNacional'>, departamento?: string | null): boolean {
  const d = normalizarDepartamento(departamento);
  return !!d && (!!s.coberturaNacional || d === BASE);
}

/** "Arequipa" o "todo el Perú", para los textos de la tienda. */
export const zonaVenta = (s: Pick<Settings, 'coberturaNacional'>) => (s.coberturaNacional ? 'todo el Perú' : BASE);
