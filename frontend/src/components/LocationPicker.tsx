import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { spotPinIcon, useLeafletMap } from '../hooks/useLeafletMap';

interface LocationPickerProps {
  center: [number, number];
  value: [number, number] | null;
  onChange: (pos: [number, number]) => void;
}

/** 地図をタップしてスポットの位置を決める */
export const LocationPicker: React.FC<LocationPickerProps> = ({ center, value, onChange }) => {
  const { containerRef, map } = useLeafletMap(center, 12);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!map) return;
    const handler = (e: L.LeafletMouseEvent) => onChange([e.latlng.lat, e.latlng.lng]);
    map.on('click', handler);
    return () => {
      map.off('click', handler);
    };
  }, [map, onChange]);

  useEffect(() => {
    map?.flyTo(center, 12, { duration: 0.6 });
  }, [map, center]);

  useEffect(() => {
    if (!map) return;
    markerRef.current?.remove();
    markerRef.current = value ? L.marker(value, { icon: spotPinIcon('#059669', '📍', { active: true }) }).addTo(map) : null;
  }, [map, value]);

  return (
    <div className="relative h-56 rounded-xl overflow-hidden border border-stone-200">
      <div ref={containerRef} className="w-full h-full" />
      {!value && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center z-[500]">
          <span className="text-[11px] font-bold bg-stone-900/80 text-white px-3 py-1 rounded-full">地図をタップして場所を選んでください</span>
        </div>
      )}
    </div>
  );
};
