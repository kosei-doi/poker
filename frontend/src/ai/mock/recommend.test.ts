import { describe, expect, it } from 'vitest';
import { FAMOUS_PLACES } from '../../data/famous';
import { emptyConditions, many, snapshot, spot, town, voice } from '../../test/fixtures';
import type { Tag, TownSummary } from '../../types';
import { recommendSync } from './recommend';

const kyoto = FAMOUS_PLACES.find((f) => f.id === 'kyoto-bamboo')!;

/** 満足度が高く「知らなかった」が多い＝穴場の声 */
const good = (spotId: string, tags: Tag[] = []) => many(6, () => voice(spotId, 5, 'unknown', tags));

function world() {
  const towns = [
    town('near', { oneWayMin: 60, roundTripYen: 4000 }),
    town('far', { oneWayMin: 150, roundTripYen: 6000 }),
    town('pricey', { oneWayMin: 90, roundTripYen: 9000, companions: ['ふたり'] }),
    town('famous', { oneWayMin: 80 }),
    town('meh', { oneWayMin: 80 }),
    town('silent', { oneWayMin: 30 }),
  ];
  const spots = [
    spot('near-s', 'near', { costYen: 500 }),
    spot('far-s', 'far'),
    spot('pricey-s', 'pricey', { costYen: 2000 }),
    spot('famous-s', 'famous'),
    spot('meh-s', 'meh'),
    spot('silent-s', 'silent'),
  ];
  const voices = [
    ...good('near-s', ['竹', '静か']),
    ...good('far-s', ['竹', '静か', '散策']),
    ...good('pricey-s', ['静か']),
    ...many(12, () => voice('famous-s', 5, 'known', ['静か'])),
    ...many(6, () => voice('meh-s', 2, 'unknown', ['静か'])),
    ...many(3, () => voice('meh-s', 4, 'unknown', ['静か'])),
  ];
  return { towns, spots, voices };
}

describe('recommend', () => {
  it('7.4 のルールを上から当て、1町は最初に当たったルールでだけ外れる', () => {
    const { towns, spots, voices } = world();
    const r = recommendSync(
      emptyConditions({ stay: '日帰り', budgetYen: 10000, companion: '友達と', moods: ['静か'] }),
      snapshot(towns, spots, voices),
    );
    expect(r.eliminated).toEqual([
      { townId: 'far', rule: 'dayTrip', reason: '日帰りには遠い（片道150分）' },
      { townId: 'pricey', rule: 'budget', reason: '予算を超える（約11,000円）' },
      { townId: 'meh', rule: 'satisfaction', reason: '満足度が低い' },
      { townId: 'famous', rule: 'hole', reason: 'もう知られている' },
    ]);
    expect(r.candidateIds).toEqual(['near']);
  });

  it('声0件の町は候補にも eliminated にも入れない', () => {
    const { towns, spots, voices } = world();
    const r = recommendSync(emptyConditions(), snapshot(towns, spots, voices));
    expect(r.candidateIds).not.toContain('silent');
    expect(r.eliminated.map((e) => e.townId)).not.toContain('silent');
  });

  it('片道・誰との理由文', () => {
    const { towns, spots, voices } = world();
    const r = recommendSync(emptyConditions({ maxOneWayMin: 70, companion: '家族と' }), snapshot(towns, spots, voices));
    expect(r.eliminated[0]).toEqual({ townId: 'far', rule: 'oneWay', reason: '片道150分かかる' });
    expect(r.eliminated).toContainEqual({ townId: 'pricey', rule: 'oneWay', reason: '片道90分かかる' });
    const r2 = recommendSync(emptyConditions({ companion: '家族と' }), snapshot(towns, spots, voices));
    expect(r2.eliminated).toContainEqual({ townId: 'pricey', rule: 'companion', reason: '家族と向きではない' });
  });

  it('有名地なしは穴場度の高い順、4位以下は rank で外れる（最大3件）', () => {
    const towns = ['a', 'b', 'c', 'd'].map((id) => town(id));
    const spots = towns.map((t) => spot(`${t.id}-s`, t.id));
    const voices = [
      ...many(6, () => voice('a-s', 4, 'unknown', ['静か'])),
      ...many(6, () => voice('b-s', 5, 'unknown', ['静か'])),
      ...[...many(3, () => voice('c-s', 5, 'unknown', ['静か'])), ...many(3, () => voice('c-s', 4, 'known', ['静か']))],
      ...many(10, () => voice('d-s', 5, 'unknown', ['静か'])),
    ];
    const r = recommendSync(emptyConditions(), snapshot(towns, spots, voices));
    expect(r.candidateIds).toEqual(['d', 'b', 'a']);
    expect(r.eliminated).toEqual([{ townId: 'c', rule: 'rank', reason: '上位3町に入らなかった' }]);
  });

  it('有名地ありは一致度の高い順（同じなら穴場度の高い順）。一致度0は外れる', () => {
    const towns = ['a', 'b', 'c', 'd'].map((id) => town(id));
    const spots = towns.map((t) => spot(`${t.id}-s`, t.id));
    const voices = [
      ...many(6, () => voice('a-s', 5, 'unknown', ['竹'])),
      ...many(6, () => voice('b-s', 4, 'unknown', ['竹', '静か', '散策'])),
      ...many(10, () => voice('c-s', 5, 'unknown', ['竹'])),
      ...many(6, () => voice('d-s', 5, 'unknown', ['海'])),
    ];
    const r = recommendSync(emptyConditions({ famous: kyoto }), snapshot(towns, spots, voices));
    expect(r.candidateIds).toEqual(['b', 'c', 'a']);
    expect(r.eliminated).toEqual([{ townId: 'd', rule: 'famous', reason: '京都の竹林に似た声がない' }]);
  });

  it('判定には summaries のタグを使う（声1件にだけあるタグでは残らない）', () => {
    const towns = [town('a')];
    const spots = [spot('a-s', 'a')];
    const voices = many(6, () => voice('a-s', 5, 'unknown', ['温泉']));
    voices.push(voice('a-s', 5, 'unknown', ['竹']));
    const summaries: Record<string, TownSummary> = { a: { townId: 'a', catchphrase: '湯の町', tags: [{ tag: '温泉', count: 6 }] } };
    const r = recommendSync(emptyConditions({ moods: ['竹'] }), snapshot(towns, spots, voices, summaries));
    expect(r.eliminated).toEqual([{ townId: 'a', rule: 'mood', reason: '#竹 の声がない' }]);
  });

  it('雰囲気が複数あれば全部を持つ町だけ残し、理由文は最初に欠けたタグ', () => {
    const towns = [town('a'), town('b')];
    const spots = [spot('a-s', 'a'), spot('b-s', 'b')];
    const voices = [...good('a-s', ['静か', '温泉', '海鮮']), ...good('b-s', ['静か', '海'])];
    const r = recommendSync(emptyConditions({ moods: ['静か', '海鮮', '温泉'] }), snapshot(towns, spots, voices));
    expect(r.candidateIds).toEqual(['a']);
    expect(r.eliminated).toEqual([{ townId: 'b', rule: 'mood', reason: '#海鮮 の声がない' }]);
  });

  it('辞書にない有名地は notices に1行', () => {
    const { towns, spots, voices } = world();
    const r = recommendSync(emptyConditions({ unknownFamous: 'ハワイ' }), snapshot(towns, spots, voices));
    expect(r.notices).toEqual(['『ハワイ』はまだ対応していないので、ほかの条件で探しました']);
  });

  describe('0件のときのヒント', () => {
    it('予算と片道は、出るための最小値を返す', () => {
      const { towns, spots, voices } = world();
      const r = recommendSync(emptyConditions({ budgetYen: 3000, maxOneWayMin: 40 }), snapshot(towns, spots, voices));
      expect(r.candidateIds).toEqual([]);
      // 1つ外しても出ないので、2つ外せば出る組を返す
      expect(r.relaxHints).toEqual([
        { rule: null, label: '「片道40分」と「予算3,000円」を外す', townCount: 3, patch: { maxOneWayMin: null, budgetYen: null } },
      ]);
      const r2 = recommendSync(emptyConditions({ budgetYen: 3000 }), snapshot(towns, spots, voices));
      expect(r2.relaxHints).toEqual([{ rule: 'budget', label: '予算を約5,000円にする', townCount: 1, patch: { budgetYen: 5000 } }]);
      const r3 = recommendSync(emptyConditions({ maxOneWayMin: 40 }), snapshot(towns, spots, voices));
      expect(r3.relaxHints).toEqual([{ rule: 'oneWay', label: '片道を60分以内にする', townCount: 1, patch: { maxOneWayMin: 60 } }]);
    });

    it('日帰り・誰と・雰囲気・有名地を1つずつ外す', () => {
      const towns = [town('a', { oneWayMin: 150, companions: ['ふたり'] })];
      const spots = [spot('a-s', 'a')];
      const voices = good('a-s', ['静か', '竹']);
      const snap = snapshot(towns, spots, voices);
      expect(recommendSync(emptyConditions({ stay: '日帰り' }), snap).relaxHints).toEqual([
        { rule: 'dayTrip', label: '泊まりにする', townCount: 1, patch: { stay: '泊まり' } },
      ]);
      expect(recommendSync(emptyConditions({ companion: '家族と' }), snap).relaxHints).toEqual([
        { rule: 'companion', label: '「家族と」を外す', townCount: 1, patch: { companion: null } },
      ]);
      expect(recommendSync(emptyConditions({ moods: ['静か', '海'] }), snap).relaxHints).toEqual([
        { rule: 'mood', label: '#海 を外す', townCount: 1, patch: { moods: ['静か'] } },
      ]);
      const fam = FAMOUS_PLACES.find((f) => f.id === 'atami')!;
      expect(recommendSync(emptyConditions({ famous: fam }), snap).relaxHints).toEqual([
        { rule: 'famous', label: '「熱海」のたとえを外す', townCount: 1, patch: { famous: null } },
      ]);
    });

    it('2つ外しても出ないときは「3つ以上」', () => {
      const towns = [town('a', { oneWayMin: 150, roundTripYen: 20000, companions: ['ふたり'] })];
      const spots = [spot('a-s', 'a')];
      const snap = snapshot(towns, spots, good('a-s', ['静か']));
      expect(
        recommendSync(emptyConditions({ stay: '日帰り', budgetYen: 3000, companion: '家族と' }), snap).relaxHints,
      ).toEqual([{ rule: null, label: '条件を3つ以上緩めてください', townCount: 0, patch: null }]);
    });

    it('候補があるときはヒントを返さない', () => {
      const { towns, spots, voices } = world();
      expect(recommendSync(emptyConditions(), snapshot(towns, spots, voices)).relaxHints).toEqual([]);
    });
  });
});
