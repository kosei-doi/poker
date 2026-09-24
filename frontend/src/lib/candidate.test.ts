import { describe, expect, it } from 'vitest';
import { FAMOUS_PLACES } from '../data/famous';
import { emptyConditions, snapshot, spot, town, voice } from '../test/fixtures';
import { buildCandidateView, buildReasonText, selectFamousEvidence, selectQuotes } from './candidate';

const at = (d: number) => ({ createdAt: new Date(Date.UTC(2026, 5, d)).toISOString() });

describe('selectQuotes', () => {
  it('知らなかった×満足度4以上を新しい順 → 足りなければ満足度4以上で補う（最大3件・重複なし）', () => {
    const u1 = voice('s', 4, 'unknown', [], at(1));
    const u2 = voice('s', 5, 'unknown', [], at(5));
    const k1 = voice('s', 5, 'known', [], at(9));
    const k2 = voice('s', 4, 'unsure', [], at(3));
    const low = voice('s', 3, 'unknown', [], at(10));
    expect(selectQuotes([u1, u2, k1, k2, low])).toEqual([u2, u1, k1]);
    expect(selectQuotes([k2, low])).toEqual([k2]);
    expect(selectQuotes([low])).toEqual([]);
  });
});

describe('selectFamousEvidence', () => {
  it('共通タグ数 → 知らなかった → 新しい順。満足度3以下は選ばない', () => {
    const a = voice('s', 4, 'known', ['竹'], at(9));
    const b = voice('s', 4, 'known', ['竹', '静か'], at(1));
    const c = voice('s', 4, 'unknown', ['竹', '静か'], at(2));
    const d = voice('s', 3, 'unknown', ['竹', '静か', '散策'], at(10));
    const e = voice('s', 5, 'unknown', ['竹', '静か'], at(3));
    expect(selectFamousEvidence([a, b, c, d, e], ['竹', '静か', '散策'])).toBe(e);
    expect(selectFamousEvidence([a, b], ['竹', '静か'])).toBe(b);
    expect(selectFamousEvidence([a], ['海'])).toBeNull();
    expect(selectFamousEvidence([a], [])).toBeNull();
  });
});

describe('buildReasonText', () => {
  it('知らずに満足した人の数と引用。声がなければ null', () => {
    const u = voice('s', 5, 'unknown', [], { evidence: '竹が最高。' });
    const k = voice('s', 5, 'known', [], { evidence: '良かった' });
    expect(buildReasonText([u, k], [u, k])).toBe('知らずに訪れて満足した人が1人。『竹が最高』');
    expect(buildReasonText([k], [k])).toBe('訪れた人の声:『良かった』');
    expect(buildReasonText([], [])).toBeNull();
  });
  it('有名地の裏付けの声があれば、それを先に引用する', () => {
    const u = voice('s', 5, 'unknown', [], { evidence: 'お寺が良かった' });
    const lead = voice('s', 4, 'known', ['竹'], { evidence: '竹林が静かだった。' });
    expect(buildReasonText([u, lead], [u, lead], lead)).toBe('知らずに訪れて満足した人が1人。『竹林が静かだった』');
  });
});

describe('buildCandidateView', () => {
  const kyoto = FAMOUS_PLACES.find((f) => f.id === 'kyoto-bamboo')!;
  const towns = [town('t')];
  const spots = [spot('s', 't')];
  const base = [
    voice('s', 4, 'unknown', ['竹', '静か'], at(1)),
    voice('s', 4, 'unknown', ['竹', '静か'], at(2)),
    voice('s', 4, 'unknown', ['竹'], at(3)),
    voice('s', 4, 'known', ['竹'], at(4)),
    voice('s', 4, 'known', ['海'], at(5)),
  ];

  it('一致タグ・一致度・裏付けの声・引用を作る', () => {
    const v = buildCandidateView('t', emptyConditions({ famous: kyoto }), snapshot(towns, spots, base))!;
    expect(v.matchedTags).toEqual(['竹', '静か']);
    expect(v.matchRate).toBeCloseTo(2 / 3, 10);
    expect(v.famousEvidence).toBe(base[1]);
    expect(v.quotes).toEqual([base[2], base[1], base[0]]);
    expect(v.reasonText).toContain('3人');
    // 理由の文は、似ている理由の欄とは別の、たとえに沿った声を引用する
    expect(v.reasonText).toContain(base[0].evidence);
  });

  it('有名地がなければ一致度と裏付けは null', () => {
    const v = buildCandidateView('t', emptyConditions(), snapshot(towns, spots, base))!;
    expect(v.matchRate).toBeNull();
    expect(v.famousEvidence).toBeNull();
    expect(v.matchedTags).toEqual([]);
  });

  it('確定した声を足してやり直すと、その声が quotes[0] になり件数が1増える（設計 決定#10）', () => {
    const before = buildCandidateView('t', null, snapshot(towns, spots, base))!;
    const added = voice('s', 5, 'unknown', ['竹', '静か'], { createdAt: '2026-09-24T10:00:00.000Z', source: 'user' });
    const after = buildCandidateView('t', null, snapshot(towns, spots, [...base, added]))!;
    expect(after.quotes[0]).toBe(added);
    expect(after.stats.count).toBe(before.stats.count + 1);
  });

  it('声のない町は null', () => {
    expect(buildCandidateView('t', null, snapshot(towns, spots, []))).toBeNull();
  });
});
