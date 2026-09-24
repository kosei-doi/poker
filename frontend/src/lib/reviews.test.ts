import { describe, expect, it } from 'vitest';
import { SPOTS } from '../data/spots';
import { SEED_VOICES } from '../data/voices';
import { spot, voice } from '../test/fixtures';
import type { PostedSpot } from './partner';
import { EMPTY_FILTER, listReviews, reviewSpotOptions } from './reviews';

const at = (d: string) => ({ createdAt: `2026-0${d}T00:00:00.000Z` });

const spots = [
  spot('a2', 'A', { order: 2 }),
  spot('a1', 'A', { order: 1 }),
  spot('b1', 'B'),
];
const posted: PostedSpot = {
  ...spot('posted-1', 'A', { order: 0 }),
  posted: true,
  photoSpotId: 'a1',
  createdAt: '2026-09-01T00:00:00.000Z',
};
const allSpots = [...spots, posted];

const v1 = voice('a1', 5, 'unknown', [], at('5-01'));
const v2 = voice('a2', 3, 'known', [], at('7-01'));
const v3 = voice('a1', 4, 'unsure', [], at('6-01'));
const v4 = voice('b1', 5, 'unknown', [], at('8-01'));
const v5 = voice('posted-1', 2, 'unknown', [], at('9-02'));
const voices = [v1, v2, v3, v4, v5];

const ids = (rows: { voice: { id: string } }[]) => rows.map((r) => r.voice.id);

describe('listReviews', () => {
  it('その町の声だけを新しい順に返し、スポットを添える', () => {
    const { rows, total } = listReviews('A', allSpots, voices, EMPTY_FILTER);
    expect(ids(rows)).toEqual([v5.id, v2.id, v3.id, v1.id]);
    expect(total).toBe(4);
    expect(rows[0].spot.id).toBe('posted-1');
  });

  it('スポットで絞り込む。total は絞り込み前の件数', () => {
    const { rows, total } = listReviews('A', allSpots, voices, { ...EMPTY_FILTER, spotId: 'a1' });
    expect(ids(rows)).toEqual([v3.id, v1.id]);
    expect(total).toBe(4);
  });

  it('満足度で絞り込む（複数選択）', () => {
    const { rows } = listReviews('A', allSpots, voices, { ...EMPTY_FILTER, satisfactions: [5, 2] });
    expect(ids(rows)).toEqual([v5.id, v1.id]);
  });

  it('知っていたかで絞り込む（複数選択）', () => {
    const { rows } = listReviews('A', allSpots, voices, { ...EMPTY_FILTER, knowns: ['known', 'unsure'] });
    expect(ids(rows)).toEqual([v2.id, v3.id]);
  });

  it('条件を組み合わせると AND になる', () => {
    const { rows } = listReviews('A', allSpots, voices, { spotId: 'a1', satisfactions: [4, 5], knowns: ['unknown'] });
    expect(ids(rows)).toEqual([v1.id]);
    const none = listReviews('A', allSpots, voices, { spotId: 'a2', satisfactions: [5], knowns: [] });
    expect(none.rows).toEqual([]);
    expect(none.total).toBe(4);
  });

  it('声のない町は 0 件', () => {
    expect(listReviews('Z', allSpots, voices, EMPTY_FILTER)).toEqual({ rows: [], total: 0 });
  });

  it('実データ: 初期の声の町ごとの件数と一致し、新しい順になっている', () => {
    const townId = SPOTS[0].townId;
    const spotIds = new Set(SPOTS.filter((s) => s.townId === townId).map((s) => s.id));
    const { rows, total } = listReviews(townId, SPOTS, SEED_VOICES, EMPTY_FILTER);
    expect(total).toBe(SEED_VOICES.filter((v) => spotIds.has(v.spotId)).length);
    const times = rows.map((r) => Date.parse(r.voice.createdAt));
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });
});

describe('reviewSpotOptions', () => {
  it('町のスポットを order 順、投稿は後ろに並べ、件数を添える（0件も含む）', () => {
    const opts = reviewSpotOptions('A', allSpots, [v1, v3, v5, v4]);
    expect(opts.map((o) => [o.spot.id, o.count])).toEqual([
      ['a1', 2],
      ['a2', 0],
      ['posted-1', 1],
    ]);
  });

  it('ほかの町のスポットは含めない', () => {
    expect(reviewSpotOptions('B', allSpots, voices).map((o) => o.spot.id)).toEqual(['b1']);
  });
});
