import L from 'leaflet';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import boundariesJson from '../../data/boundaries.json';
import { spotsOfTown } from '../../data/spots';
import { TOWNS, townById } from '../../data/towns';
import { SPOT_FIT, type Boundaries, type BoundaryProps } from '../../lib/geo';
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
  selected: { fillColor: '#fbbf24', fillOpacity: 0.55, color: '#fff7d6', weight: 3 },
};

/**
 * ラベルが地図の端からはみ出さないよう、はみ出した分だけ内側へずらす。
 * ラベルの基準点（町の中）が画面の外にあるときは、端に積み重ならないよう隠す。
 */
function keepLabelsInside(container: HTMLElement) {
  const box = container.getBoundingClientRect();
  const margin = 6;
  const bottomSafe = 28; // 出典表示の分
  container.querySelectorAll<HTMLElement>('.town-label').forEach((el) => {
    el.style.setProperty('--dx', '0px');
    el.style.setProperty('--dy', '0px');
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const anchorVisible = cx >= box.left && cx <= box.right && cy >= box.top && cy <= box.bottom - bottomSafe;
    el.style.visibility = anchorVisible ? '' : 'hidden';
    if (!anchorVisible) return;
    const dx = Math.max(0, box.left + margin - r.left) + Math.min(0, box.right - margin - r.right);
    const dy = Math.max(0, box.top + margin - r.top) + Math.min(0, box.bottom - bottomSafe - r.bottom);
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
        const choose = () => {
          if (hasVoiceRef.current(town.id)) dispatch({ type: 'SELECT_TOWN', townId: town.id });
          else dispatch({ type: 'SHOW_NO_VOICE', townId: town.id });
        };
        layer.on('click', choose);
        // キーボードでも町を選べるようにする
        layer.on('add', () => {
          const path = (layer as L.Path).getElement();
          if (!path) return;
          path.setAttribute('tabindex', '0');
          path.setAttribute('role', 'button');
          path.setAttribute('aria-label', town.name);
          path.addEventListener('keydown', (e) => {
            const key = (e as KeyboardEvent).key;
            if (key === 'Enter' || key === ' ') {
              e.preventDefault();
              choose();
            }
          });
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
      // 町を選んでズームしているあいだは、スポットの番号と重ならないよう全町を町名だけにする（一言とタグはパネルに出ている）
      const lit = state.lit.includes(town.id) && state.selectedTownId === null;
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
    const spots = spotsOfTown(id);
    // 町全体ではなく、スポットを含む範囲に合わせる（番号と線が重ならないように。町の境界は画面外に出てよい）
    const layer = layersRef.current.get(id) as L.Polygon | undefined;
    const target =
      spots.length > 0 ? L.latLngBounds(spots.map((s) => [s.lat, s.lng] as L.LatLngTuple)).pad(SPOT_FIT.pad) : layer?.getBounds();
    if (target) {
      const opts = { padding: [SPOT_FIT.padding, SPOT_FIT.padding] as L.PointTuple, maxZoom: SPOT_FIT.maxZoom };
      if (animate) map.flyToBounds(target, { ...opts, duration: 0.8 });
      else map.fitBounds(target, { ...opts, animate: false });
    }
    if (spots.length > 1) {
      // 明るい町の上でも見えるよう、暗い縁取りの上に明るい破線を重ねる
      const path = spots.map((s) => [s.lat, s.lng] as L.LatLngTuple);
      L.polyline(path, { color: '#1c1300', weight: 7, opacity: 0.75, interactive: false }).addTo(group);
      L.polyline(path, { color: '#fff7d6', weight: 3, dashArray: '8 6', opacity: 1, interactive: false }).addTo(group);
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
  // スマホでは理由の一覧が地図の下（画面外）になるので、演出のあいだは地図の上にも出す（D1-3）
  const showNarrowingOnMap = state.consultPhase === 'narrowing' && state.narrowingLog.length > 0 && !state.selectedTownId;

  return (
    <div className="relative h-full w-full">
      <div ref={elRef} className="h-full w-full" role="region" aria-label="茨城県北の地図" />
      {showNarrowingOnMap && (
        <ul
          aria-hidden
          className="lg:hidden absolute left-2 bottom-9 z-[1000] max-w-[85%] space-y-1 pointer-events-none"
        >
          {state.narrowingLog.map((e) => (
            <li key={e.townId} className="fade-in rounded-lg bg-panel/90 border border-line px-2.5 py-1 text-xs">
              <span className="text-muted">{townById(e.townId)?.name}</span> — {e.reason}
            </li>
          ))}
        </ul>
      )}
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
