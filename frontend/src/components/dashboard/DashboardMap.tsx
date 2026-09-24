import L from 'leaflet';
import { useEffect, useRef } from 'react';
import boundariesJson from '../../data/boundaries.json';
import { TOWNS } from '../../data/towns';
import type { Boundaries, BoundaryProps } from '../../lib/geo';
import { useReducedMotion } from '../../state/useReducedMotion';
import type { TownId } from '../../types';
import { plainLabelHtml } from '../map/labels';

const boundaries = boundariesJson as unknown as Boundaries;
const ATTRIBUTION = '出典：「国土数値情報（行政区域データ）」（国土交通省）を加工して作成';
const townByCode = new Map(TOWNS.map((t) => [t.code, t]));

// D1-2 と同じ表現（SpotlightMap の STYLES.lit / STYLES.dimmed と同じ値）
const LIT: L.PathOptions = { fillColor: '#fbbf24', fillOpacity: 0.85, color: '#fde68a', weight: 2 };
const DARK: L.PathOptions = { fillColor: '#1e293b', fillOpacity: 0.3, color: '#3b4660', weight: 1 };
const TRANSITION = 'fill 400ms ease, fill-opacity 400ms ease, stroke 400ms ease, stroke-width 400ms ease';

function litNameHtml(name: string): string {
  return plainLabelHtml(name).replace('class="town-label"', 'class="town-label is-lit"');
}

/** ダッシュボードの地図（N7-1・N7-2・N7-5）: 今のタグを持つ町だけを光らせる */
export function DashboardMap({
  litTownIds,
  onSelectTown,
  label,
}: {
  litTownIds: TownId[];
  onSelectTown: (townId: TownId) => void;
  label?: string;
}) {
  const reduced = useReducedMotion();
  const elRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef(new Map<TownId, L.Path>());
  const labelLayerRef = useRef<L.LayerGroup | null>(null);
  const litRef = useRef<TownId[]>(litTownIds);
  litRef.current = litTownIds;
  const selectRef = useRef(onSelectTown);
  selectRef.current = onSelectTown;

  // 地図は1回だけ作る。タイルは使わない
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const layers = layersRef.current;
    const map = L.map(el, {
      renderer: L.svg({ padding: 0.5 }),
      zoomSnap: 0.25,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
      minZoom: 8,
      maxZoom: 13,
    });
    map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noreferrer">Leaflet</a>');
    map.attributionControl.addAttribution(ATTRIBUTION);
    const geo = L.geoJSON(boundaries, {
      style: () => ({ ...DARK, className: 'dashboard-town-path' }),
      onEachFeature: (feature, layer) => {
        const town = townByCode.get((feature.properties as BoundaryProps).code);
        if (!town) return;
        const path = layer as L.Path;
        layers.set(town.id, path);
        const isLit = () => litRef.current.includes(town.id);
        layer.on('click', () => selectRef.current(town.id));
        // キーボードでも町を選べるようにする
        layer.on('add', () => {
          const node = path.getElement();
          if (!node) return;
          node.setAttribute('tabindex', '0');
          node.setAttribute('role', 'button');
          node.setAttribute('aria-label', isLit() ? `${town.name}（今のタグの穴場）` : town.name);
          node.addEventListener('keydown', (e) => {
            const key = (e as KeyboardEvent).key;
            if (key === 'Enter' || key === ' ') {
              e.preventDefault();
              selectRef.current(town.id);
            }
          });
        });
        layer.on('mouseover', () => path.setStyle({ weight: 3.5 }));
        layer.on('mouseout', () => path.setStyle(isLit() ? LIT : DARK));
      },
    }).addTo(map);
    map.fitBounds(geo.getBounds(), { padding: [16, 16] });
    map.setMaxBounds(geo.getBounds().pad(0.6));
    labelLayerRef.current = L.layerGroup().addTo(map);

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => map.invalidateSize()) : null;
    ro?.observe(el);
    return () => {
      ro?.disconnect();
      map.remove();
      layers.clear();
      labelLayerRef.current = null;
    };
  }, []);

  // 色のフェードは「動きを減らす」設定が無効なときだけ（N7-6）
  useEffect(() => {
    for (const layer of layersRef.current.values()) {
      const node = layer.getElement() as SVGElement | undefined;
      if (node) node.style.transition = reduced ? 'none' : TRANSITION;
    }
  }, [reduced]);

  // 光る町・暗い町の切り替えとラベル（配列が作り直されても中身が同じなら何もしない）
  const litKey = litTownIds.join(',');
  useEffect(() => {
    const litTownIds = litRef.current;
    for (const [id, layer] of layersRef.current) {
      const lit = litTownIds.includes(id);
      layer.setStyle(lit ? LIT : DARK);
      if (lit) layer.bringToFront();
      const town = TOWNS.find((t) => t.id === id);
      layer.getElement()?.setAttribute('aria-label', lit && town ? `${town.name}（今のタグの穴場）` : (town?.name ?? ''));
    }
    const group = labelLayerRef.current;
    if (!group) return;
    group.clearLayers();
    for (const town of TOWNS) {
      const lit = litTownIds.includes(town.id);
      L.marker(town.labelPoint, {
        icon: L.divIcon({
          html: lit ? litNameHtml(town.name) : plainLabelHtml(town.name),
          className: 'leaflet-div-icon-reset',
          iconSize: undefined,
        }),
        interactive: false,
        keyboard: false,
        zIndexOffset: lit ? 1000 : 0,
      }).addTo(group);
    }
  }, [litKey]);

  return (
    <div className="relative h-full w-full">
      <div ref={elRef} className="h-full w-full" role="region" aria-label={label ?? '茨城県北の地図'} />
    </div>
  );
}
