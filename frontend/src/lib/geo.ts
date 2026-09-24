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
