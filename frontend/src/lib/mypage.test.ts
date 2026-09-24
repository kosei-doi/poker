import { describe, expect, it } from 'vitest';
import { buildSnapshot } from '../data/seed';
import { SEED_VOICES } from '../data/voices';
import { voice } from '../test/fixtures';
import type { Voice } from '../types';
import { buildMyVoices, buildSummary, buildVisitedTowns, excerptOf } from './mypage';

const at = (min: number) => new Date(Date.UTC(2026, 8, 1) + min * 60000).toISOString();
const mine = (spotId: string, min: number, opts: Partial<Voice> = {}) =>
  voice(spotId, 4, 'unknown', ['竹'], { source: 'user', createdAt: at(min), ...opts });

describe('buildMyVoices', () => {
  it('自分の声だけを新しい順に並べる（サンプルの声は除く）', () => {
    const a = mine('hitachiota-bamboo', 1);
    const b = mine('takahagi-hananuki', 3);
    const c = mine('hitachiota-bamboo', 2);
    const rows = buildMyVoices([...SEED_VOICES.slice(0, 3), a, b, c], []);
    expect(rows.map((r) => r.voice.id)).toEqual([b.id, c.id, a.id]);
    expect(rows[0].town.id).toBe('takahagi');
    expect(rows[0].spot.id).toBe('takahagi-hananuki');
  });

  it('スポットが見つからない声は除く', () => {
    expect(buildMyVoices([mine('no-such-spot', 1)], [])).toEqual([]);
  });

  it('感想の冒頭は40字まで、超えたら「…」を付ける', () => {
    const s40 = 'あ'.repeat(40);
    const long = mine('hitachiota-bamboo', 1, { text: `${s40}いう` });
    const exact = mine('hitachiota-bamboo', 2, { text: s40 });
    const rows = buildMyVoices([long, exact], []);
    expect(rows.find((r) => r.voice.id === long.id)!.excerpt).toBe(`${s40}…`);
    expect(rows.find((r) => r.voice.id === exact.id)!.excerpt).toBe(s40);
    expect(excerptOf('短い感想')).toBe('短い感想');
  });
});

describe('buildVisitedTowns', () => {
  it('町ごとの件数と今の穴場度を出し、件数の多い順 → 最後に書いた順に並べる', () => {
    const user = [
      mine('takahagi-hananuki', 1),
      mine('hitachiota-bamboo', 2),
      mine('hitachiota-bamboo', 3),
    ];
    const stats = buildSnapshot([...SEED_VOICES, ...user]).stats;
    const rows = buildVisitedTowns([...SEED_VOICES, ...user], [], stats);
    expect(rows.map((r) => [r.town.id, r.myCount])).toEqual([
      ['hitachiota', 2],
      ['takahagi', 1],
    ]);
    expect(rows[0].hole).toBe(stats.towns.hitachiota!.hole);
  });

  it('同数なら最後に書いた日時が新しい町が先', () => {
    const user = [mine('hitachiota-bamboo', 5), mine('takahagi-hananuki', 9)];
    const rows = buildVisitedTowns(user, [], buildSnapshot(user).stats);
    expect(rows.map((r) => r.town.id)).toEqual(['takahagi', 'hitachiota']);
  });

  it('穴場度が無い町は null', () => {
    const user = [mine('takahagi-hananuki', 1)];
    const rows = buildVisitedTowns(user, [], { mean: 3, spots: {}, towns: {} });
    expect(rows[0].hole).toBeNull();
  });
});

describe('buildSummary', () => {
  it('書いた声・行った町・気になる町の数', () => {
    const user = [mine('takahagi-hananuki', 1), mine('hitachiota-bamboo', 2), mine('hitachiota-bamboo', 3)];
    expect(buildSummary([...SEED_VOICES, ...user], ['daigo', 'hitachi'])).toEqual({ voices: 3, towns: 2, favorites: 2 });
  });

  it('0件なら全部0（一覧も空）', () => {
    expect(buildSummary([], [])).toEqual({ voices: 0, towns: 0, favorites: 0 });
    expect(buildMyVoices(SEED_VOICES, [])).toEqual([]);
    expect(buildVisitedTowns([], [], buildSnapshot(SEED_VOICES).stats)).toEqual([]);
  });
});
