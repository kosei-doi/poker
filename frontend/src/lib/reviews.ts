import type { Known, Satisfaction, Spot, SpotId, TownId, Voice } from '../types';
import { voicesOfTown } from './candidate';
import { isPosted } from './partner';

/** レビュー一覧の絞り込み（N6-4）。空配列は「すべて」 */
export interface ReviewFilter {
  spotId: SpotId | null;
  satisfactions: Satisfaction[];
  knowns: Known[];
}

export const EMPTY_FILTER: ReviewFilter = { spotId: null, satisfactions: [], knowns: [] };

export interface ReviewRow {
  voice: Voice;
  spot: Spot;
}

/** 町のスポットを並べる: 既存スポットは order 順、投稿したスポットは後ろ（投稿の古い順） */
function townSpots(townId: TownId, spots: Spot[]): Spot[] {
  const own = spots.filter((s) => s.townId === townId);
  const base = own.filter((s) => !isPosted(s)).sort((a, b) => a.order - b.order);
  const posted = own.filter(isPosted).sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  return [...base, ...posted];
}

/** 町に寄せられた声を新しい順に。rows は絞り込み後、total は絞り込み前の件数 */
export function listReviews(
  townId: TownId,
  spots: Spot[],
  voices: Voice[],
  filter: ReviewFilter,
): { rows: ReviewRow[]; total: number } {
  const spotById = new Map(spots.filter((s) => s.townId === townId).map((s) => [s.id, s]));
  const all = voicesOfTown(townId, { spots, voices })
    .map((voice) => ({ voice, spot: spotById.get(voice.spotId)! }))
    .sort((a, b) => Date.parse(b.voice.createdAt) - Date.parse(a.voice.createdAt));
  const rows = all.filter(
    ({ voice }) =>
      (filter.spotId === null || voice.spotId === filter.spotId) &&
      (filter.satisfactions.length === 0 || filter.satisfactions.includes(voice.satisfaction)) &&
      (filter.knowns.length === 0 || filter.knowns.includes(voice.known)),
  );
  return { rows, total: all.length };
}

/** スポットの絞り込みの選択肢（声0件のスポットも含む） */
export function reviewSpotOptions(townId: TownId, spots: Spot[], voices: Voice[]): { spot: Spot; count: number }[] {
  const counts = new Map<SpotId, number>();
  for (const v of voices) counts.set(v.spotId, (counts.get(v.spotId) ?? 0) + 1);
  return townSpots(townId, spots).map((spot) => ({ spot, count: counts.get(spot.id) ?? 0 }));
}
