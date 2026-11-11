'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import type { Map as LeafletMap, Marker as LeafletMarker, LeafletMouseEvent } from 'leaflet';
import { BASE, CENTROS, LIMITES_AREQUIPA, LIMITES_PERU, normalizarDepartamento } from '@/lib/peru';

type Limites = [[number, number], [number, number]];
const dentro = (lat: number, lng: number, [[s, o], [n, e]]: Limites) => lat >= s && lat <= n && lng >= o && lng <= e;

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
  /** Departamento de entrega: el mapa se abre en su capital. */
  departamento?: string;
  /** Envío a todo el Perú: el mapa deja marcar en cualquier parte del país (si no, solo en la ciudad de Arequipa). */
  nacional?: boolean;
}

export default function MapPicker({ onLocationSelect, initialLat, initialLng, departamento, nacional = false }: MapPickerProps) {
  const dep = normalizarDepartamento(departamento) ?? BASE;
  const centro = CENTROS[dep];
  const limites: Limites = nacional ? LIMITES_PERU : LIMITES_AREQUIPA;
  // El mapa se crea una vez; estos valores cambian después (al elegir otro departamento)
  const limitesRef = useRef(limites);
  const avisarRef = useRef(onLocationSelect);
  useEffect(() => { limitesRef.current = limites; avisarRef.current = onLocationSelect; });
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const [coords, setCoords] = useState<[number, number]>(
    initialLat && initialLng ? [initialLat, initialLng] : centro
  );
  const [, setLoaded] = useState(false);
  // Si Leaflet o los mosaicos del mapa no cargan (sin internet, bloqueados), se explica qué hacer
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    // Si el componente se desmonta antes de que cargue Leaflet, no se crea el mapa
    // (evita "Map container is already initialized" al montar dos veces).
    let cancelado = false;

    // Dynamic import of leaflet
    let mosaicoListo = false;
    let errores = 0;
    const espera = setTimeout(() => { if (!cancelado && !mosaicoListo) setFallo(true); }, 12000);

    import('leaflet').then((L) => {
      if (cancelado || !mapRef.current || mapInstanceRef.current) return;
      // Fix default icon
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!, {
        center: coords,
        zoom: 14,
        maxBounds: limitesRef.current,
        minZoom: nacional ? 5 : 12,
      });

      const capa = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);
      capa.on('tileload', () => { mosaicoListo = true; setFallo(false); });
      capa.on('tileerror', () => { errores++; if (!mosaicoListo && errores >= 4) setFallo(true); });

      const marker = L.marker(coords, { draggable: true }).addTo(map);
      markerRef.current = marker;
      mapInstanceRef.current = map;

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        // Fuera de la zona de entrega vuelve a donde estaba
        if (!dentro(pos.lat, pos.lng, limitesRef.current)) {
          marker.setLatLng(map.getCenter());
          return;
        }
        setCoords([pos.lat, pos.lng]);
        avisarRef.current(pos.lat, pos.lng, `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`);
      });

      map.on('click', (e: LeafletMouseEvent) => {
        const pos = e.latlng;
        if (!dentro(pos.lat, pos.lng, limitesRef.current)) return;
        marker.setLatLng(pos);
        setCoords([pos.lat, pos.lng]);
        avisarRef.current(pos.lat, pos.lng, `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`);
      });

      setLoaded(true);
    }).catch(() => { if (!cancelado) setFallo(true); });

    return () => {
      cancelado = true;
      clearTimeout(espera);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- el mapa se crea una sola vez; los cambios se aplican abajo
  }, []);

  // Al cambiar de departamento (o activar el envío nacional), el mapa se mueve a su capital
  const [vistaPrevia, setVistaPrevia] = useState(`${dep}|${nacional}`);
  if (vistaPrevia !== `${dep}|${nacional}`) {
    setVistaPrevia(`${dep}|${nacional}`);
    setCoords(centro);
  }
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setMaxBounds(limites);
    map.setMinZoom(nacional ? 5 : 12);
    map.setView(centro, 14);
    markerRef.current?.setLatLng(centro);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- centro y limites se derivan de dep y nacional
  }, [dep, nacional]);

  return (
    <div>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div className="relative">
        <div ref={mapRef} className="w-full h-48 rounded-xl overflow-hidden border border-linea" aria-label="Mapa para marcar la ubicación de entrega" role="application" />
        {fallo && (
          <div role="status" className="absolute inset-0 z-[500] flex flex-col items-center justify-center gap-1 rounded-xl border border-linea bg-fondo px-6 text-center">
            <MapPin className="h-6 w-6 text-tenue" aria-hidden="true" />
            <p className="text-sm font-semibold">No pudimos cargar el mapa</p>
            <p className="text-xs text-tenue">No pasa nada: escribe tu dirección con una referencia y te llamamos si hace falta.</p>
          </div>
        )}
      </div>
      {!fallo && (
        <div className="flex items-center gap-2 mt-2">
          <MapPin className="h-3 w-3 text-primario" aria-hidden="true" />
          <span className="text-xs text-tenue">
            {coords[0].toFixed(4)}, {coords[1].toFixed(4)}{nacional ? ` · ${dep}` : ` · Solo entregas en ${BASE}`}
          </span>
        </div>
      )}
    </div>
  );
}
