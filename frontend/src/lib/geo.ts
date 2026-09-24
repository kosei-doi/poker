import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from 'geojson';

function inRing(lng: number, lat: number, ring: Position[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function inPolygon(lng: number, lat: number, rings: Position[][]): boolean {
  if (!inRing(lng, lat, rings[0])) return false;
  return !rings.slice(1).some((hole) => inRing(lng, lat, hole));
}

/** 点（lat, lng）が図形の中にあるか（レイキャスティング） */
export function pointInFeature(lat: number, lng: number, feature: Feature<Polygon | MultiPolygon>): boolean {
  const g = feature.geometry;
  if (g.type === 'Polygon') return inPolygon(lng, lat, g.coordinates);
  return g.coordinates.some((poly) => inPolygon(lng, lat, poly));
}

export type BoundaryProps = { code: string; name: string };
export type Boundaries = FeatureCollection<Polygon | MultiPolygon, BoundaryProps>;

const TILE = 256;

/** Web メルカトルでの世界座標（ズーム0で 256px 四方） */
export function project(lat: number, lng: number): { x: number; y: number } {
  const s = Math.sin((lat * Math.PI) / 180);
  return {
    x: (TILE * (lng + 180)) / 360,
    y: TILE * (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)),
  };
}

export interface FitOptions {
  /** 地図の幅・高さ（px） */
  width: number;
  height: number;
  /** 四辺の余白（px） */
  padding: number;
  /** 範囲をこの割合だけ広げる（Leaflet の LatLngBounds.pad と同じ） */
  pad: number;
  maxZoom: number;
  zoomSnap: number;
}

/** 点の集まりを地図に収めたときのズーム（Leaflet の getBoundsZoom と同じ考え方） */
export function fitZoom(points: [number, number][], o: FitOptions): number {
  const lats = points.map((p) => p[0]);
  const lngs = points.map((p) => p[1]);
  const dLat = (Math.max(...lats) - Math.min(...lats)) * o.pad;
  const dLng = (Math.max(...lngs) - Math.min(...lngs)) * o.pad;
  const nw = project(Math.max(...lats) + dLat, Math.min(...lngs) - dLng);
  const se = project(Math.min(...lats) - dLat, Math.max(...lngs) + dLng);
  const w = Math.max(se.x - nw.x, 1e-9);
  const h = Math.max(se.y - nw.y, 1e-9);
  const scale = Math.min((o.width - 2 * o.padding) / w, (o.height - 2 * o.padding) / h);
  const zoom = Math.floor(Math.log2(scale) / o.zoomSnap) * o.zoomSnap;
  return Math.min(zoom, o.maxZoom);
}

/** そのズームでの2点間の距離（px） */
export function pixelDistance(a: [number, number], b: [number, number], zoom: number): number {
  const pa = project(a[0], a[1]);
  const pb = project(b[0], b[1]);
  return Math.hypot(pa.x - pb.x, pa.y - pb.y) * 2 ** zoom;
}

/** 町を選んだときのズーム（D1-4）。町全体ではなく、その町のスポットを含む範囲に合わせる */
export const SPOT_FIT = { pad: 0.3, padding: 24, maxZoom: 14, zoomSnap: 0.25 } as const;
/** スポットの番号ピン同士が離れているべき最小の距離（px）。ピンは 26px */
export const MIN_PIN_GAP_PX = 40;
