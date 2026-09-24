import L from 'leaflet';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import boundariesJson from '../../data/boundaries.json';
import { spotsOfTown } from '../../data/spots';
import { TOWNS, townById } from '../../data/towns';
import type { Boundaries, BoundaryProps } from '../../lib/geo';
import { useApp } from '../../state/context';
import { useSnapshot } from '../../state/selectors';
import { useReducedMotion } from '../../state/useReducedMotion';
import { useVoiceFlow } from '../../state/useVoiceFlow';
import type { TownId } from '../../types';
import { litLabelHtml, plainLabelHtml, spotPinHtml, spotPopupHtml } from './labels';

const boundaries = boundariesJson as unknown as Boundaries;
const ATTRIBUTION = '出典：「国土数値情報（行政区域データ）」（国土交通省）を加工して作成';
const townByCode = new Map(TOWNS.map((t) => [t.code, t]));

type TownLook = 'initial' | 'noVoice' | 'dimmed' | 'lit' | 'selected';

const STYLES: Record<TownLook, L.PathOptions> = {
  initial: { fillColor: '#475569', fillOpacity: 0.6, color: '#94a3b8', weight: 1 },
  noVoice: { fillColor: '#1e293b', fillOpacity: 0.3, color: '#3b4660', weight: 1 },
  dimmed: { fillColor: '#1e293b', fillOpacity: 0.3, color: '#3b4660', weight: 1 },
  lit: { fillColor: '#fbbf24', fillOpacity: 0.85, color: '#fde68a', weight: 2 },
  selected: { fillColor: '#fbbf24', fillOpacity: 0.85, color: '#fff7d6', weight: 3 },
};

/** ラベルが地図の端からはみ出さないよう、はみ出した分だけ内側へずらす */
function keepLabelsInside(container: HTMLElement) {
  const box = container.getBoundingClientRect();
  const margin = 6;
  container.querySelectorAll<HTMLElement>('.town-label').forEach((el) => {
    el.style.setProperty('--dx', '0px');
    el.style.setProperty('--dy', '0px');
    const r = el.getBoundingClientRect();
    const dx = Math.max(0, box.left + margin - r.left) + Math.min(0, box.right - margin - r.right);
    const dy = Math.max(0, box.top + margin - r.top) + Math.min(0, box.bottom - 28 - r.bottom);
    el.style.setProperty('--dx', `${dx}px`);
    el.style.setProperty('--dy', `${dy}px`);
  });
}

/** スポットライト地図（D1-1〜D1-4） */
export function SpotlightMap() {
  const { state, dispatch } = useApp();
  const snap = useSnapshot();
  const reduced = useReducedMotion();
  const { open } = useVoiceFlow();

  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef(new Map<TownId, L.Path>());
  const looksRef = useRef(new Map<TownId, TownLook>());
  const allBoundsRef = useRef<L.LatLngBounds | null>(null);
  const labelLayerRef = useRef<L.LayerGroup | null>(null);
  const spotLayerRef = useRef<L.LayerGroup | null>(null);
  const hasVoiceRef = useRef<(id: TownId) => boolean>(() => false);
  hasVoiceRef.current = (id) => snap.stats.towns[id] != null;
  const openRef = useRef(open);
  openRef.current = open;

  // 地図は1回だけ作る。タイルは使わない（決定#7）
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const map = L.map(el, { renderer: L.svg({ padding: 0.5 }), preferCanvas: false, zoomSnap: 0.25, zoomControl: true, attributionControl: true, minZoom: 8, maxZoom: 15 });
    map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noreferrer">Leaflet</a>');
    map.attributionControl.addAttribution(ATTRIBUTION);
    const geo = L.geoJSON(boundaries, {
      style: () => ({ ...STYLES.initial, className: 'town-path' }),
      onEachFeature: (feature, layer) => {
        const town = townByCode.get((feature.properties as BoundaryProps).code);
        if (!town) return;
        layersRef.current.set(town.id, layer as L.Path);
        layer.on('click', () => {
          if (hasVoiceRef.current(town.id)) dispatch({ type: 'SELECT_TOWN', townId: town.id });
          else dispatch({ type: 'SHOW_NO_VOICE', townId: town.id });
        });
        layer.on('mouseover', () => (layer as L.Path).setStyle({ weight: 3.5 }));
        layer.on('mouseout', () => (layer as L.Path).setStyle(STYLES[looksRef.current.get(town.id) ?? 'initial']));
      },
    }).addTo(map);
    allBoundsRef.current = geo.getBounds();
    map.fitBounds(geo.getBounds(), { padding: [16, 16] });
    map.setMaxBounds(geo.getBounds().pad(0.6));
    labelLayerRef.current = L.layerGroup().addTo(map);
    spotLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    map.on('zoomend moveend', () => keepLabelsInside(el));
    const onResize = () => {
      map.invalidateSize();
      keepLabelsInside(el);
    };
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
    ro?.observe(el);
    return () => {
      ro?.disconnect();
      map.remove();
      mapRef.current = null;
      layersRef.current.clear();
    };
  }, [dispatch]);

  // 町の明るさ（D1-2・D1-3）
  useEffect(() => {
    for (const [id, layer] of layersRef.current) {
      let look: TownLook = 'initial';
      if (snap.stats.towns[id] == null) look = 'noVoice';
      else if (state.selectedTownId === id) look = 'selected';
      else if (state.lit.includes(id)) look = 'lit';
      else if (state.dimmed.includes(id) || state.lit.length > 0) look = 'dimmed';
      looksRef.current.set(id, look);
      layer.setStyle({ ...STYLES[look] });
      if (look === 'lit' || look === 'selected') layer.bringToFront();
    }
  }, [state.dimmed, state.lit, state.selectedTownId, snap.stats]);

  // ラベル: 光った町は一言とタグ、それ以外は町名だけ
  useEffect(() => {
    const group = labelLayerRef.current;
    if (!group) return;
    group.clearLayers();
    for (const town of TOWNS) {
      // 選んだ町はスポットの番号と重ならないよう、ズーム中は町名だけにする（一言とタグはパネルに出ている）
      const lit = state.lit.includes(town.id) && state.selectedTownId !== town.id;
      const html = lit ? litLabelHtml(town.name, state.summaries[town.id]) : plainLabelHtml(town.name);
      L.marker(town.labelPoint, {
        icon: L.divIcon({ html, className: 'leaflet-div-icon-reset', iconSize: undefined }),
        interactive: false,
        keyboard: false,
        zIndexOffset: lit ? 1000 : 0,
      }).addTo(group);
    }
    if (elRef.current) keepLabelsInside(elRef.current);
  }, [state.lit, state.selectedTownId, state.summaries, snap.stats]);

  // 町の中の表示（D1-4）: ズーム、スポットの番号、回る順の線
  useEffect(() => {
    const map = mapRef.current;
    const group = spotLayerRef.current;
    if (!map || !group) return;
    group.clearLayers();
    const id = state.selectedTownId;
    const animate = !reduced;
    if (!id) {
      if (allBoundsRef.current) map.fitBounds(allBoundsRef.current, { padding: [16, 16], animate });
      return;
    }
    const layer = layersRef.current.get(id) as L.Polygon | undefined;
    if (layer) {
      const b = layer.getBounds();
      if (animate) map.flyToBounds(b, { padding: [24, 24], duration: 0.8 });
      else map.fitBounds(b, { padding: [24, 24], animate: false });
    }
    const spots = spotsOfTown(id);
    if (spots.length > 1) {
      L.polyline(
        spots.map((s) => [s.lat, s.lng] as L.LatLngTuple),
        { color: '#fbbf24', weight: 2.5, dashArray: '6 6', opacity: 0.95, interactive: false },
      ).addTo(group);
    }
    for (const s of spots) {
      const marker = L.marker([s.lat, s.lng], {
        icon: L.divIcon({ html: spotPinHtml(s.order), className: 'leaflet-div-icon-reset', iconSize: undefined }),
        title: `${s.order}. ${s.name}`,
        zIndexOffset: 2000,
      });
      marker.bindPopup(spotPopupHtml(`${s.order}. ${s.name}`, s.kind), { closeButton: true });
      marker.on('popupopen', (e) => {
        const btn = (e.popup.getElement() as HTMLElement | undefined)?.querySelector('[data-write-voice]');
        btn?.addEventListener('click', () => {
          map.closePopup();
          openRef.current(s.id);
        }, { once: true });
      });
      marker.addTo(group);
    }
  }, [state.selectedTownId, reduced]);

  const noVoiceTown = state.noVoiceTownId ? townById(state.noVoiceTownId) : null;

  return (
    <div className="relative h-full w-full">
      <div ref={elRef} className="h-full w-full" role="region" aria-label="茨城県北の地図" />
      {noVoiceTown && (
        <div
          role="status"
          className="absolute left-3 right-3 sm:right-auto sm:max-w-xs top-3 z-[1000] rounded-xl border border-line bg-panel/95 px-4 py-3 shadow-lg fade-in"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-sm">{noVoiceTown.name}</p>
              <p className="text-sm text-muted mt-0.5">まだ声が集まっていません</p>
            </div>
            <button
              type="button"
              onClick={() => dispatch({ type: 'SHOW_NO_VOICE', townId: null })}
              className="p-1 -m-1 text-muted hover:text-text"
              aria-label="閉じる"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
