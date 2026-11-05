'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import type { Map as LeafletMap, Marker as LeafletMarker, LeafletMouseEvent } from 'leaflet';

// Arequipa bounds
const AREQUIPA_CENTER: [number, number] = [-16.4090, -71.5375];
const AREQUIPA_BOUNDS: [[number, number], [number, number]] = [[-16.55, -71.65], [-16.25, -71.40]];

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
}

export default function MapPicker({ onLocationSelect, initialLat, initialLng }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const [coords, setCoords] = useState<[number, number]>(
    initialLat && initialLng ? [initialLat, initialLng] : AREQUIPA_CENTER
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
        maxBounds: AREQUIPA_BOUNDS,
        minZoom: 12,
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
        // Check if within Arequipa bounds
        if (pos.lat < AREQUIPA_BOUNDS[0][0] || pos.lat > AREQUIPA_BOUNDS[1][0] ||
            pos.lng < AREQUIPA_BOUNDS[0][1] || pos.lng > AREQUIPA_BOUNDS[1][1]) {
          marker.setLatLng(AREQUIPA_CENTER);
          return;
        }
        setCoords([pos.lat, pos.lng]);
        onLocationSelect(pos.lat, pos.lng, `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`);
      });

      map.on('click', (e: LeafletMouseEvent) => {
        const pos = e.latlng;
        if (pos.lat < AREQUIPA_BOUNDS[0][0] || pos.lat > AREQUIPA_BOUNDS[1][0] ||
            pos.lng < AREQUIPA_BOUNDS[0][1] || pos.lng > AREQUIPA_BOUNDS[1][1]) return;
        marker.setLatLng(pos);
        setCoords([pos.lat, pos.lng]);
        onLocationSelect(pos.lat, pos.lng, `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`);
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
  }, []);

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
            {coords[0].toFixed(4)}, {coords[1].toFixed(4)} · Solo entregas en Arequipa
          </span>
        </div>
      )}
    </div>
  );
}
