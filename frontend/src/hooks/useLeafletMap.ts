import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

/**
 * Leaflet の地図を安全に初期化する。
 * タブ切り替えやモーダル表示でサイズが変わってもタイルが崩れないよう ResizeObserver で追従する。
 */
export function useLeafletMap(center: [number, number], zoom: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const instance = L.map(container, { center, zoom, zoomControl: false });
    L.control.zoom({ position: 'topright' }).addTo(instance);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(instance);

    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(container);
    setMap(instance);

    return () => {
      observer.disconnect();
      instance.remove();
      setMap(null);
    };
    // 初期位置は初回のみ使う
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { containerRef, map };
}

/** スポット用の丸いピン */
export function spotPinIcon(color: string, emoji: string, opts: { active?: boolean; badge?: string } = {}) {
  const { active = false, badge } = opts;
  const size = active ? 44 : 36;
  return L.divIcon({
    className: 'custom-map-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="position:relative;width:${size}px;height:${size}px">
        ${active ? `<div style="position:absolute;inset:-6px;border-radius:9999px;background:${color};opacity:.35" class="animate-ping"></div>` : ''}
        <div style="width:100%;height:100%;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 6px 14px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:${active ? 20 : 16}px">${emoji}</div>
        ${badge ? `<div style="position:absolute;top:-6px;right:-8px;background:#1c1917;color:white;font-size:10px;font-weight:800;border-radius:9999px;padding:1px 5px;border:2px solid white">${badge}</div>` : ''}
      </div>`,
  });
}
