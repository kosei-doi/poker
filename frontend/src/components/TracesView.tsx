import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ShieldCheck, Star, Plus } from 'lucide-react';
import type { Region } from '../types';
import { anabaScore } from '../lib/anaba';

interface Props {
  regions: Region[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAddVoice: () => void;
}

/**
 * 「知られていないけど外れではない」を示す画面。
 * 穴場を勧めるうえで、実際に行った人の記録が唯一の担保になる。
 */
export const TracesView: React.FC<Props> = ({ regions, selectedId, onSelect, onAddVoice }) => {
  const region = regions.find((r) => r.id === selectedId) || regions[0];
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current, { zoomControl: false, attributionControl: false })
      .setView([region.lat, region.lng], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 18 }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapRef.current = map;
    setReady(true);
    return () => { map.remove(); mapRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.eachLayer((l) => { if (l instanceof L.Marker) map.removeLayer(l); });

    const pts: [number, number][] = [];
    region.places.forEach((p) => {
      pts.push([p.lat, p.lng]);
      L.marker([p.lat, p.lng], {
        icon: L.divIcon({
          className: '',
          html: `<span style="display:grid;place-items:center;width:26px;height:26px;border-radius:50%;
                 background:#FBBF24;color:#0E1013;font-size:10px;font-weight:800;
                 box-shadow:0 0 0 4px rgba(251,191,36,.22)">${p.kind === 'food' ? '食' : p.kind === 'photo' ? '撮' : '催'}</span>`,
          iconSize: [26, 26], iconAnchor: [13, 13],
        }),
      }).addTo(map).bindPopup(`<b>${p.name}</b><br>${p.desc}`);
    });
    if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.35));
  }, [region, ready]);

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="text-2xl font-extrabold">行った人</h1>
        <button onClick={onAddVoice}
          className="inline-flex items-center gap-1.5 border border-white/15 text-stone-300 text-xs font-bold px-3 py-2 rounded-lg hover:bg-white/5 shrink-0">
          <Plus className="w-3.5 h-3.5" />記録を残す
        </button>
      </div>
      <p className="text-sm text-stone-400 mb-6">
        穴場は「評判が確定していない場所」です。だから勧める前に、実際に行った人の記録を先に出します。
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {regions.map((r) => (
          <button key={r.id} onClick={() => onSelect(r.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
              r.id === region.id ? 'bg-amber-400 border-amber-400 text-[#0E1013]' : 'border-white/15 text-stone-400 hover:text-stone-100'
            }`}>{r.name}</button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div>
          <div ref={mapEl} className="h-[300px] lg:h-[420px] rounded-2xl border border-white/10 overflow-hidden bg-white/5" />
          <p className="text-[11px] text-stone-500 mt-2">催・食・撮の3種類を地図に置いています。1日で回れる距離かどうかが見えます。</p>
        </div>

        <div>
          <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] p-4 mb-4">
            <p className="text-[11px] font-bold text-amber-300 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />知られていないけど、外れではない理由
            </p>
            <p className="text-sm text-stone-200">
              {region.voices.length}人が行って、平均{
                (region.voices.reduce((a, v) => a + v.rating, 0) / region.voices.length).toFixed(1)
              }点。知名度は5段階で{region.fame}。
              <span className="text-amber-300 font-bold"> 穴場度 {anabaScore(region).toFixed(1)}</span>。
            </p>
          </div>

          <ul className="space-y-3">
            {region.voices.map((v) => (
              <li key={v.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold">{v.name}<span className="text-stone-500 font-normal"> ・{v.from}</span></span>
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: v.rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">{v.text}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-stone-300">{v.tag}</span>
                  <span className="text-[10px] text-stone-600">{v.date}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
