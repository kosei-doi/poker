import L from 'leaflet';
import prefecturesJson from '../../data/prefectures.json';
import type { PrefectureProps, Prefectures } from '../../lib/japan';

const prefectures = prefecturesJson as unknown as Prefectures;

/** 都道府県レイヤーを置く pane。県北6市町（overlayPane = 400）より下に描く */
export const PREF_PANE = 'prefectures';
const PREF_PANE_Z = '350';

/** 都道府県（茨城県を含む）の見た目（13.7.2） */
export const PREF_STYLE: L.PathOptions = { fillColor: '#1e293b', fillOpacity: 0.55, color: '#3b4660', weight: 0.8 };
const PREF_HOVER: L.PathOptions = { color: '#64748b', weight: 1.4 };

/** 日本全体を表示しているときの県北6市町の見た目（声のない常陸大宮市も含めて光らせる） */
export const JAPAN_TOWN_STYLE: L.PathOptions = { fillColor: '#fbbf24', fillOpacity: 0.85, color: '#fde68a', weight: 1 };

/**
 * 都道府県レイヤーを作る（まだ地図には足さない）。
 * パスには tabindex を付けない（47個のタブ移動を避ける。県北へはラベルのボタンでキーボードから行ける）
 */
export function createJapanLayer(map: L.Map, onPick: (pref: PrefectureProps) => void): L.GeoJSON {
  if (!map.getPane(PREF_PANE)) map.createPane(PREF_PANE).style.zIndex = PREF_PANE_Z;
  const renderer = L.svg({ pane: PREF_PANE, padding: 0.5 });
  return L.geoJSON(prefectures, {
    pane: PREF_PANE,
    style: () => ({ ...PREF_STYLE, renderer, className: 'pref-path' }),
    onEachFeature: (feature, layer) => {
      const path = layer as L.Path;
      path.on('click', (e) => {
        // 地図の「ほかの場所を押した」扱いにしない
        L.DomEvent.stopPropagation(e);
        onPick(feature.properties as PrefectureProps);
      });
      path.on('mouseover', () => path.setStyle(PREF_HOVER));
      path.on('mouseout', () => path.setStyle(PREF_STYLE));
    },
  });
}

/** 「対応エリア: 茨城県北」のラベル（押すと県北へズーム。中身は button なのでキーボードでも押せる） */
export function kenpokuLabelHtml(): string {
  return '<button type="button" class="kenpoku-label" aria-label="対応エリア: 茨城県北。押すと茨城県北へズームします"><span class="kicker">対応エリア:</span> <span class="area">茨城県北</span></button>';
}
