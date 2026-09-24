import { describe, expect, it } from 'vitest';
import type { DataSnapshot } from '../ai/types';
import { buildSnapshot } from '../data/seed';
import { SEED_VOICES } from '../data/voices';
import { snapshot, spot, town, voice } from '../test/fixtures';
import { TAGS } from '../types';
import type { Tag, TagCount, TownSummary } from '../types';
import { showcaseRows, showcaseTags, stepIndex } from './showcase';

const at = (d: number) => ({ createdAt: new Date(Date.UTC(2026, 5, d)).toISOString() });
const summary = (townId: string, tags: TagCount[]): TownSummary => ({ townId, catchphrase: `${townId}の一言`, tags });

/** 穴場度を指定して並びを確かめるため、計算済みの値を書き換える */
function setHole(snap: DataSnapshot, holes: Record<string, number>): DataSnapshot {
  for (const [id, hole] of Object.entries(holes)) snap.stats.towns[id]!.hole = hole;
  return snap;
}

describe('実データ', () => {
  const snap = buildSnapshot(SEED_VOICES);

  it('タグの一覧は語彙の順で、町のタグにあるものだけ', () => {
    const tags = showcaseTags(snap.summaries);
    const townTags = new Set(Object.values(snap.summaries).flatMap((s) => s.tags.map((t) => t.tag)));
    expect(tags).toContain('竹');
    expect(tags).toContain('海鮮');
    expect(tags).toEqual(TAGS.filter((t) => townTags.has(t)));
    for (const t of TAGS) if (!townTags.has(t)) expect(tags).not.toContain(t);
  });

  it("showcaseRows('静か') は穴場度の高い順", () => {
    const rows = showcaseRows('静か', snap);
    expect(rows.length).toBeGreaterThan(1);
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].stats.hole).toBeGreaterThanOrEqual(rows[i].stats.hole);
    for (const r of rows) expect(r.summary.tags.map((t) => t.tag)).toContain('静か');
  });

  it("showcaseRows('竹') の常陸太田市", () => {
    const row = showcaseRows('竹', snap).find((r) => r.town.id === 'hitachiota');
    expect(row).toBeDefined();
    expect(row!.tagCount).toBe(6);
    expect(row!.evidence?.tags).toContain('竹');
    expect(row!.spots[0].spot.id).toBe('hitachiota-bamboo');
  });
});

describe('showcaseRows（小さなデータ）', () => {
  const towns = [town('a'), town('b'), town('c'), town('d')];

  it('今のタグを持つ町を穴場度の高い順、同じなら towns の順。声のない町とタグを持たない町は出ない', () => {
    const spots = [spot('sa', 'a'), spot('sb', 'b'), spot('sc', 'c'), spot('sd', 'd')];
    const voices = [voice('sa', 5, 'unknown', ['海']), voice('sb', 5, 'unknown', ['海']), voice('sc', 5, 'unknown', ['竹'])];
    const summaries = {
      a: summary('a', [{ tag: '海', count: 1 }]),
      b: summary('b', [{ tag: '海', count: 1 }]),
      c: summary('c', [{ tag: '竹', count: 1 }]),
      // d は声0件（stats が null）。summaries にあっても出さない
      d: summary('d', [{ tag: '海', count: 1 }]),
    };
    const snap = snapshot(towns, spots, voices, summaries);
    expect(snap.stats.towns.d).toBeNull();

    setHole(snap, { a: 2, b: 3 });
    expect(showcaseRows('海', snap).map((r) => r.town.id)).toEqual(['b', 'a']);
    setHole(snap, { a: 3, b: 3 });
    expect(showcaseRows('海', snap).map((r) => r.town.id)).toEqual(['a', 'b']);
    expect(showcaseRows('星空', snap)).toEqual([]);
  });

  it('tagCount は summary.tags のそのタグの count', () => {
    const snap = snapshot([town('a')], [spot('sa', 'a')], [voice('sa', 5, 'unknown', ['海', '静か'])], {
      a: summary('a', [{ tag: '海', count: 7 }, { tag: '静か', count: 2 }]),
    });
    expect(showcaseRows('海', snap)[0].tagCount).toBe(7);
    expect(showcaseRows('静か', snap)[0].tagCount).toBe(2);
  });

  describe('根拠の声', () => {
    const summaries = { a: summary('a', [{ tag: '海', count: 3 }]) };
    const make = (voices: ReturnType<typeof voice>[]) =>
      showcaseRows('海', snapshot([town('a')], [spot('sa', 'a'), spot('sa2', 'a')], voices, summaries))[0].evidence;

    it('知らなかった×満足度4以上を優先し、その中で新しい順', () => {
      const knownNew = voice('sa', 5, 'known', ['海'], at(20));
      const unknownOld = voice('sa', 4, 'unknown', ['海'], at(1));
      const unknownNew = voice('sa2', 4, 'unknown', ['海'], at(10));
      expect(make([knownNew, unknownOld, unknownNew])).toBe(unknownNew);
    });

    it('知らなかった声がなければ満足度4以上を新しい順', () => {
      const old = voice('sa', 5, 'known', ['海'], at(1));
      const recent = voice('sa', 4, 'unsure', ['海'], at(5));
      expect(make([old, recent])).toBe(recent);
    });

    it('満足度3以下とタグを含まない声は選ばない', () => {
      const low = voice('sa', 3, 'unknown', ['海'], at(30));
      const other = voice('sa', 5, 'unknown', ['竹'], at(31));
      const ok = voice('sa', 4, 'known', ['海'], at(1));
      expect(make([low, other, ok])).toBe(ok);
      expect(make([low, other])).toBeNull();
    });
  });

  describe('スポット', () => {
    it('満足度4以上でタグを含む声の件数の多い順（同数は元の並び）、1件以上・最大3件', () => {
      const spots = ['s1', 's2', 's3', 's4', 's5'].map((id) => spot(id, 'a'));
      const v = (id: string, sat: 1 | 2 | 3 | 4 | 5, tags: Tag[] = ['海']) => voice(id, sat, 'unsure', tags);
      const voices = [
        v('s1', 4),
        v('s2', 5), v('s2', 4), v('s2', 4),
        v('s3', 4), v('s3', 5),
        v('s4', 4),
        v('s5', 3), v('s5', 5, ['竹']), // 数えない声だけ
      ];
      const snap = snapshot([town('a')], spots, voices, { a: summary('a', [{ tag: '海', count: 7 }]) });
      const row = showcaseRows('海', snap)[0];
      expect(row.spots.map((s) => [s.spot.id, s.count])).toEqual([['s2', 3], ['s3', 2], ['s1', 1]]);
    });

    it('町が投稿したスポットも含む。ほかの町のスポットは含まない', () => {
      const posted = { ...spot('posted', 'a'), posted: true };
      const spots = [spot('sa', 'a'), posted, spot('sb', 'b')];
      const voices = [voice('sa', 4, 'unsure', ['海']), voice('posted', 5, 'unsure', ['海']), voice('posted', 4, 'unsure', ['海']), voice('sb', 5, 'unsure', ['海'])];
      const snap = snapshot([town('a'), town('b')], spots, voices, {
        a: summary('a', [{ tag: '海', count: 3 }]),
        b: summary('b', [{ tag: '海', count: 1 }]),
      });
      const row = showcaseRows('海', snap).find((r) => r.town.id === 'a')!;
      expect(row.spots.map((s) => [s.spot.id, s.count])).toEqual([['posted', 2], ['sa', 1]]);
    });
  });
});

describe('stepIndex', () => {
  it('次へ・前へで端を折り返す', () => {
    expect(stepIndex(0, 3, 1)).toBe(1);
    expect(stepIndex(2, 3, 1)).toBe(0);
    expect(stepIndex(1, 3, -1)).toBe(0);
    expect(stepIndex(0, 3, -1)).toBe(2);
  });
  it('長さ0なら0、長さ1なら常に0', () => {
    expect(stepIndex(0, 0, 1)).toBe(0);
    expect(stepIndex(0, 0, -1)).toBe(0);
    expect(stepIndex(0, 1, 1)).toBe(0);
    expect(stepIndex(0, 1, -1)).toBe(0);
  });
});
