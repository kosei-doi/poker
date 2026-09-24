import L from 'leaflet';
import { Crosshair } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import boundariesJson from '../../data/boundaries.json';
import { townById } from '../../data/towns';
import type { Boundaries } from '../../lib/geo';
import { isInsideTown } from '../../lib/partner';
import type { TownId } from '../../types';

const boundaries = boundariesJson as unknown as Boundaries;

type LatLng = { lat: number; lng: number };

interface Props {
  townId: TownId;
  value: LatLng | null;
  onChange: (value: LatLng) => void;
  invalid?: boolean;
  describedBy?: string;
  /** 「町の中心に置く」ボタンの id（誤りの一覧からのリンク先） */
  buttonId?: string;
}

const PIN = L.divIcon({
  className: 'leaflet-div-icon-reset',
  html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#fbbf24;border:3px solid #fff7d6;box-shadow:0 0 10px #fbbf24"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/** 投稿するスポットの場所を、町の地図を押して決める（N6-2）。町の境界の外は選べない */
export function LocationPicker({ townId, value, onChange, invalid, describedBy, buttonId }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [outside, setOutside] = useState(false);
  const town = townById(townId);

  // 町が変わったら地図を作り直す。タイルは使わない
  useEffect(() => {
    const el = elRef.current;
    const t = townById(townId);
    const feature = t && boundaries.features.find((f) => f.properties.code === t.code);
    if (!el || !feature) return;
    const map = L.map(el, {
      renderer: L.svg({ padding: 0.5 }),
      zoomSnap: 0.25,
      zoomControl: true,
      attributionControl: false,
      keyboard: false,
    });
    const shape = L.geoJSON(feature, {
      style: { fillColor: '#475569', fillOpacity: 0.55, color: '#fde68a', weight: 2 },
      interactive: false,
    }).addTo(map);
    map.fitBounds(shape.getBounds(), { padding: [12, 12] });
    map.setMaxBounds(shape.getBounds().pad(0.5));
    map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = round(e.latlng.lat);
      const lng = round(e.latlng.lng);
      if (!isInsideTown(townId, lat, lng)) {
        setOutside(true);
        return;
      }
      setOutside(false);
      onChangeRef.current({ lat, lng });
    });
    mapRef.current = map;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => map.invalidateSize()) : null;
    ro?.observe(el);
    setOutside(false);
    return () => {
      ro?.disconnect();
      markerRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, [townId]);

  // 選んだ点に印を置く（空になったら外す）
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (markerRef.current) markerRef.current.setLatLng([value.lat, value.lng]);
    else markerRef.current = L.marker([value.lat, value.lng], { icon: PIN, keyboard: false, interactive: false }).addTo(map);
  }, [value, townId]);

  return (
    <div className="space-y-2">
      <div
        ref={elRef}
        role="application"
        aria-label={`${town?.name ?? ''}の地図。押した場所をスポットの場所にします`}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={`h-[240px] w-full overflow-hidden rounded-lg border ${invalid ? 'border-danger' : 'border-line'}`}
      />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          id={buttonId}
          aria-describedby={describedBy}
          onClick={() => {
            if (!town) return;
            setOutside(false);
            onChange({ lat: town.labelPoint[0], lng: town.labelPoint[1] });
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-xs"
        >
          <Crosshair size={14} aria-hidden />
          町の中心に置く
        </button>
        <span className="text-xs text-muted" aria-live="polite">
          {value ? `選んだ場所: 北緯 ${value.lat.toFixed(4)}、東経 ${value.lng.toFixed(4)}` : 'まだ選んでいません'}
        </span>
      </div>
      <p role="status" className="text-xs text-danger empty:hidden">
        {outside ? '町の境界の外は選べません' : ''}
      </p>
    </div>
  );
}

const round = (n: number) => Math.round(n * 1e5) / 1e5;
