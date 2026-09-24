import L from 'leaflet';
import { Globe2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { BOUNDARY_ATTRIBUTION } from '../../data/attributions';
import boundariesJson from '../../data/boundaries.json';
import { spotsOfTown } from '../../data/spots';
import { TOWNS, townById } from '../../data/towns';
import { SPOT_FIT, type Boundaries, type BoundaryProps } from '../../lib/geo';
import {
  JAPAN_FIT_PADDING,
  JAPAN_MAX_BOUNDS_PAD,
  JAPAN_MIN_ZOOM,
  JAPAN_VIEW_BOUNDS,
  KENPOKU_LABEL_ANCHOR,
  KENPOKU_LABEL_POINT,
  KENPOKU_MAX_BOUNDS_PAD,
  KENPOKU_MIN_ZOOM,
  KENPOKU_ZOOM_MS,
  MAX_ZOOM,
  prefNoticeText,
} from '../../lib/japan';
import { useApp } from '../../state/context';
import { markJapanShown, notifyKenpokuReady, setKenpokuZooming, setMapMounted } from '../../state/mapEvents';
import type { MapView } from '../../state/reducer';
import { useSnapshot } from '../../state/selectors';
import { useReducedMotion } from '../../state/useReducedMotion';
import { useVoiceFlow } from '../../state/useVoiceFlow';
import type { TownId } from '../../types';
import { createJapanLayer, JAPAN_TOWN_STYLE, kenpokuLabelHtml } from './japanLayer';
import { litLabelHtml, plainLabelHtml, spotPinHtml, spotPopupHtml } from './labels';
import './map.css';

const boundaries = boundariesJson as unknown as Boundaries;
const townByCode = new Map(TOWNS.map((t) => [t.code, t]));
/** 県北の範囲に合わせるときの余白（v1 の値） */
const KENPOKU_FIT_PADDING = 16;
/** 県北へのズームの moveend が来なかったときに、表示の切り替えを済ませるまでの時間 */
const KENPOKU_FINISH_FALLBACK_MS = KENPOKU_ZOOM_MS + 800;
/** 準備中の表示（N1-3）を自動で消すまでの時間 */
const PREF_NOTICE_MS = 4000;

type TownLook = 'japan' | 'initial' | 'noVoice' | 'dimmed' | 'lit' | 'selected';

const STYLES: Record<TownLook, L.PathOptions> = {
  japan: JAPAN_TOWN_STYLE,
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

/** 「対応エリア: 茨城県北」のラベルが地図の右端からはみ出すときは、はみ出した分だけ左へずらす */
function keepKenpokuLabelInside(container: HTMLElement) {
  const box = container.getBoundingClientRect();
  const margin = 6;
  container.querySelectorAll<HTMLElement>('.kenpoku-label').forEach((el) => {
    el.style.setProperty('--dx', '0px');
    const r = el.getBoundingClientRect();
    el.style.setProperty('--dx', `${Math.min(0, box.right - margin - r.right)}px`);
  });
}

function keepAllLabelsInside(container: HTMLElement) {
  keepLabelsInside(container);
  keepKenpokuLabelInside(container);
}

/** スポットライト地図（D1-1〜D1-4）と日本全体の地図（N1） */
export function SpotlightMap() {
  const { state, dispatch } = useApp();
  const snap = useSnapshot();
  const reduced = useReducedMotion();
  const { open } = useVoiceFlow();

  const elRef = useRef<HTMLDivElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef(new Map<TownId, L.Path>());
  const looksRef = useRef(new Map<TownId, TownLook>());
  const allBoundsRef = useRef<L.LatLngBounds | null>(null);
  const labelLayerRef = useRef<L.LayerGroup | null>(null);
  const spotLayerRef = useRef<L.LayerGroup | null>(null);
  const japanLayerRef = useRef<L.GeoJSON | null>(null);
  const kenpokuLabelRef = useRef<L.LayerGroup | null>(null);
  const hasVoiceRef = useRef<(id: TownId) => boolean>(() => false);
  hasVoiceRef.current = (id) => snap.stats.towns[id] != null;
  const openRef = useRef(open);
  openRef.current = open;

  // 地図が今表示している範囲。県北へは moveend で切り替わる（state.mapView より遅れる）
  const [shown, setShownState] = useState<MapView>(state.mapView);
  const shownRef = useRef<MapView>(state.mapView);
  const setShown = (view: MapView) => {
    shownRef.current = view;
    setShownState(view);
  };
  /** 作り直した直後の1回は、アニメーションなしで今の mapView に合わせる */
  const firstApplyRef = useRef(true);
  /** 県北へのズームの途中 */
  const zoomingRef = useRef(false);
  /** 県北へのズームが終わったときの処理（moveend 待ち）。別の切り替えが始まったら取り消す */
  const pendingRef = useRef<{ finish: () => void; timer: ReturnType<typeof setTimeout> } | null>(null);

  // 地図は1回だけ作る。タイルは使わない（決定#7）
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    firstApplyRef.current = true;
    const map = L.map(el, {
      renderer: L.svg({ padding: 0.5 }),
      preferCanvas: false,
      zoomSnap: 0.25,
      zoomControl: true,
      attributionControl: true,
      minZoom: JAPAN_MIN_ZOOM,
      maxZoom: MAX_ZOOM,
    });
    map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noreferrer">Leaflet</a>');
    map.attributionControl.addAttribution(BOUNDARY_ATTRIBUTION);

    // 都道府県（下）→ 県北6市町 → ラベルの順に重ねる。都道府県は専用の pane で市町村の下に描く
    japanLayerRef.current = createJapanLayer(map, (p) => dispatch({ type: 'SHOW_PREF_NOTICE', name: p.name }));

    const geo = L.geoJSON(boundaries, {
      style: () => ({ ...STYLES[shownRef.current === 'japan' ? 'japan' : 'initial'], className: 'town-path' }),
      onEachFeature: (feature, layer) => {
        const town = townByCode.get((feature.properties as BoundaryProps).code);
        if (!town) return;
        layersRef.current.set(town.id, layer as L.Path);
        const choose = () => {
          // 日本全体では、町は選ばずに県北へズームする
          if (shownRef.current === 'japan') dispatch({ type: 'SET_MAP_VIEW', view: 'kenpoku' });
          else if (hasVoiceRef.current(town.id)) dispatch({ type: 'SELECT_TOWN', townId: town.id });
          else dispatch({ type: 'SHOW_NO_VOICE', townId: town.id });
        };
        layer.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          choose();
        });
        // キーボードでも町を選べるようにする（日本全体では、県北のラベルのボタンから行う）
        layer.on('add', () => {
          const path = (layer as L.Path).getElement();
          if (!path) return;
          path.setAttribute('tabindex', shownRef.current === 'japan' ? '-1' : '0');
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

    // 「対応エリア: 茨城県北」のラベルと、県北とつなぐ細い線
    const kenpokuMarker = L.marker(KENPOKU_LABEL_POINT, {
      icon: L.divIcon({ html: kenpokuLabelHtml(), className: 'leaflet-div-icon-reset', iconSize: undefined }),
      keyboard: false,
      zIndexOffset: 3000,
    });
    kenpokuMarker.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      dispatch({ type: 'SET_MAP_VIEW', view: 'kenpoku' });
    });
    kenpokuLabelRef.current = L.layerGroup([
      L.polyline([KENPOKU_LABEL_ANCHOR, KENPOKU_LABEL_POINT], { color: '#fde68a', weight: 1, opacity: 0.8, interactive: false }),
      kenpokuMarker,
    ]);

    labelLayerRef.current = L.layerGroup().addTo(map);
    spotLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setMapMounted(true);
    map.on('zoomend moveend', () => keepAllLabelsInside(el));
    const onResize = () => {
      map.invalidateSize();
      keepAllLabelsInside(el);
    };
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
    ro?.observe(el);
    return () => {
      ro?.disconnect();
      if (pendingRef.current) {
        clearTimeout(pendingRef.current.timer);
        pendingRef.current = null;
      }
      zoomingRef.current = false;
      map.remove();
      mapRef.current = null;
      japanLayerRef.current = null;
      kenpokuLabelRef.current = null;
      layersRef.current.clear();
      setMapMounted(false);
    };
  }, [dispatch]);

  // 表示の範囲（日本全体 ⇄ 県北）と、町を選んだときのズーム（N1-2・N1-4・D1-4）
  useEffect(() => {
    const map = mapRef.current;
    const all = allBoundsRef.current;
    if (!map || !all) return;
    const view = state.mapView;
    const id = state.selectedTownId;
    const animate = !reduced;

    // 県北での目標: 町を選んでいればその町のスポットを含む範囲（番号と線が重ならないように）、なければ県北全体
    let target: { bounds: L.LatLngBounds; opts: L.FitBoundsOptions } = {
      bounds: all,
      opts: { padding: [KENPOKU_FIT_PADDING, KENPOKU_FIT_PADDING] },
    };
    if (id) {
      const spots = spotsOfTown(id);
      const layer = layersRef.current.get(id) as L.Polygon | undefined;
      const bounds =
        spots.length > 0 ? L.latLngBounds(spots.map((s) => [s.lat, s.lng] as L.LatLngTuple)).pad(SPOT_FIT.pad) : layer?.getBounds();
      if (bounds) target = { bounds, opts: { padding: [SPOT_FIT.padding, SPOT_FIT.padding], maxZoom: SPOT_FIT.maxZoom } };
    }
    const japanBounds = L.latLngBounds(JAPAN_VIEW_BOUNDS);
    const japanOpts: L.FitBoundsOptions = { padding: [JAPAN_FIT_PADDING, JAPAN_FIT_PADDING] };

    const clearPending = () => {
      const p = pendingRef.current;
      if (!p) return;
      map.off('moveend', p.finish);
      clearTimeout(p.timer);
      pendingRef.current = null;
    };
    // 日本全体へは「ゆるめてから飛ぶ」、県北へは「飛んでから締める」（ズームの途中で範囲の外へ押し戻されないように）
    const relaxToJapan = () => {
      map.setMinZoom(JAPAN_MIN_ZOOM);
      map.setMaxBounds(japanBounds.pad(JAPAN_MAX_BOUNDS_PAD));
    };
    const tightenToKenpoku = () => {
      map.setMinZoom(KENPOKU_MIN_ZOOM);
      map.setMaxBounds(all.pad(KENPOKU_MAX_BOUNDS_PAD));
    };

    if (firstApplyRef.current) {
      firstApplyRef.current = false;
      if (view === 'japan') {
        relaxToJapan();
        map.fitBounds(japanBounds, { ...japanOpts, animate: false });
        markJapanShown();
        setShown('japan');
      } else {
        map.fitBounds(target.bounds, { ...target.opts, animate: false });
        tightenToKenpoku();
        setShown('kenpoku');
        notifyKenpokuReady();
      }
      return;
    }

    if (view === 'japan') {
      clearPending();
      zoomingRef.current = false;
      relaxToJapan();
      markJapanShown();
      setShown('japan');
      if (animate) map.flyToBounds(japanBounds, { ...japanOpts, duration: KENPOKU_ZOOM_MS / 1000 });
      else map.fitBounds(japanBounds, { ...japanOpts, animate: false });
      return;
    }

    if (shownRef.current === 'japan' || zoomingRef.current) {
      // 日本全体から県北へ（県北へのズームの途中で町を選んだときは、目標を変えて飛び直す）
      clearPending();
      zoomingRef.current = true;
      setKenpokuZooming(true);
      const finish = () => {
        clearPending();
        zoomingRef.current = false;
        tightenToKenpoku();
        setShown('kenpoku');
        notifyKenpokuReady();
      };
      if (animate) {
        pendingRef.current = {
          finish,
          timer: setTimeout(() => {
            if (pendingRef.current?.finish === finish) finish();
          }, KENPOKU_FINISH_FALLBACK_MS),
        };
        map.once('moveend', finish);
        map.flyToBounds(target.bounds, { ...target.opts, duration: KENPOKU_ZOOM_MS / 1000 });
      } else {
        map.fitBounds(target.bounds, { ...target.opts, animate: false });
        finish();
      }
      return;
    }

    // すでに県北を表示している（v1 の 8.3）
    if (id) {
      if (animate) map.flyToBounds(target.bounds, { ...target.opts, duration: 0.8 });
      else map.fitBounds(target.bounds, { ...target.opts, animate: false });
    } else {
      map.fitBounds(all, { padding: [KENPOKU_FIT_PADDING, KENPOKU_FIT_PADDING], animate });
    }
  }, [state.mapView, state.selectedTownId, reduced]);

  // 都道府県レイヤーと「対応エリア」のラベルは日本全体のときだけ（県北では消す。決定#18）
  useEffect(() => {
    const map = mapRef.current;
    const el = elRef.current;
    const japan = japanLayerRef.current;
    const label = kenpokuLabelRef.current;
    if (!map || !el || !japan || !label) return;
    const isJapan = shown === 'japan';
    if (isJapan) {
      japan.addTo(map);
      label.addTo(map);
      keepKenpokuLabelInside(el);
    } else {
      japan.remove();
      label.remove();
    }
    el.classList.toggle('map-japan', isJapan);
    for (const layer of layersRef.current.values()) layer.getElement()?.setAttribute('tabindex', isJapan ? '-1' : '0');
  }, [shown]);

  // 町の明るさ（D1-2・D1-3）。日本全体では6市町とも光らせ、スポットライトは県北に切り替えてから当てる
  useEffect(() => {
    for (const [id, layer] of layersRef.current) {
      let look: TownLook = 'initial';
      if (shown === 'japan') look = 'japan';
      else if (snap.stats.towns[id] == null) look = 'noVoice';
      else if (state.selectedTownId === id) look = 'selected';
      else if (state.lit.includes(id)) look = 'lit';
      else if (state.dimmed.includes(id) || state.lit.length > 0) look = 'dimmed';
      looksRef.current.set(id, look);
      layer.setStyle({ ...STYLES[look] });
      if (look === 'lit' || look === 'selected') layer.bringToFront();
    }
  }, [shown, state.dimmed, state.lit, state.selectedTownId, snap.stats]);

  // ラベル: 光った町は一言とタグ、それ以外は町名だけ。日本全体では出さない（1か所に重なるため）
  useEffect(() => {
    const group = labelLayerRef.current;
    if (!group) return;
    group.clearLayers();
    if (shown === 'japan') return;
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
  }, [shown, state.lit, state.selectedTownId, state.summaries, snap.stats]);

  // 町の中の表示（D1-4）: スポットの番号と回る順の線（ズームは上の表示範囲の effect で行う）
  useEffect(() => {
    const map = mapRef.current;
    const group = spotLayerRef.current;
    if (!map || !group) return;
    group.clearLayers();
    const id = state.selectedTownId;
    if (!id) return;
    const spots = spotsOfTown(id);
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
  }, [state.selectedTownId]);

  // 準備中の表示（N1-3）: 4秒後か、カードの外を押すと消す
  useEffect(() => {
    if (!state.prefNotice) return;
    const close = () => dispatch({ type: 'SHOW_PREF_NOTICE', name: null });
    const timer = setTimeout(close, PREF_NOTICE_MS);
    const onPointerDown = (e: PointerEvent) => {
      if (noticeRef.current?.contains(e.target as Node)) return;
      close();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [state.prefNotice, dispatch]);

  const noVoiceTown = state.noVoiceTownId ? townById(state.noVoiceTownId) : null;
  // スマホでは理由の一覧が地図の下（画面外）になるので、演出のあいだは地図の上にも出す（D1-3）
  const showNarrowingOnMap = state.consultPhase === 'narrowing' && state.narrowingLog.length > 0 && !state.selectedTownId;
  const showJapanButton = state.mapView === 'kenpoku';
  // スマホでは「日本全体を見る」ボタンの下にカードを出す（重ならないように）
  const cardTop = showJapanButton ? 'top-14 sm:top-3' : 'top-3';
  const cardClass = `absolute left-3 right-3 sm:right-auto sm:max-w-xs ${cardTop} z-[1000] rounded-xl border border-line bg-panel/95 px-4 py-3 shadow-lg fade-in`;

  return (
    <div className="relative h-full w-full">
      <div
        ref={elRef}
        className="h-full w-full"
        role="region"
        aria-label={shown === 'japan' ? '日本全体の地図' : '茨城県北の地図'}
      />
      {showJapanButton && (
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_MAP_VIEW', view: 'japan' })}
          className="absolute right-3 top-3 z-[1000] inline-flex items-center gap-1.5 rounded-xl border border-line bg-panel/95 px-3 py-2 text-sm font-bold shadow-lg hover:border-glow hover:text-glow-soft"
        >
          <Globe2 size={16} aria-hidden />
          日本全体を見る
        </button>
      )}
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
      {state.prefNotice && (
        <div ref={noticeRef} role="status" className={cardClass}>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm">
              <span className="font-bold">{state.prefNotice}</span>
              <span className="text-muted">{prefNoticeText(state.prefNotice).slice(state.prefNotice.length)}</span>
            </p>
            <button
              type="button"
              onClick={() => dispatch({ type: 'SHOW_PREF_NOTICE', name: null })}
              className="p-1 -m-1 text-muted hover:text-text"
              aria-label="閉じる"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      {noVoiceTown && (
        <div role="status" className={cardClass}>
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
