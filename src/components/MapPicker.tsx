'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

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
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [coords, setCoords] = useState<[number, number]>(
    initialLat && initialLng ? [initialLat, initialLng] : AREQUIPA_CENTER
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamic import of leaflet
    import('leaflet').then((L) => {
      // Fix default icon
      delete (L.Icon.Default.prototype as any)._getIconUrl;
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

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

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

      map.on('click', (e: any) => {
        const pos = e.latlng;
        if (pos.lat < AREQUIPA_BOUNDS[0][0] || pos.lat > AREQUIPA_BOUNDS[1][0] ||
            pos.lng < AREQUIPA_BOUNDS[0][1] || pos.lng > AREQUIPA_BOUNDS[1][1]) return;
        marker.setLatLng(pos);
        setCoords([pos.lat, pos.lng]);
        onLocationSelect(pos.lat, pos.lng, `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`);
      });

      setLoaded(true);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="w-full h-48 rounded-xl overflow-hidden border border-slate-200" />
      <div className="flex items-center gap-2 mt-2">
        <MapPin className="h-3 w-3 text-blue-500" />
        <span className="text-[10px] text-neutral-400">
          {coords[0].toFixed(4)}, {coords[1].toFixed(4)} — Solo entregas en Arequipa
        </span>
      </div>
    </div>
  );
}
