import { describe, expect, it } from 'vitest';
import { voice } from '../test/fixtures';
import { correctionSeries, spotBreakdown } from './about';

describe('correctionSeries', () => {
  it('(5×平均 + 5n) ÷ (5 + n) で、件数が増えるほど 5 に近づく', () => {
    const s = correctionSeries(3.5);
    expect(s.map((p) => p.n)).toEqual([1, 2, 3, 5, 10, 20]);
    expect(s[0].satisfaction).toBeCloseTo((5 * 3.5 + 5) / 6);
    expect(s[5].satisfaction).toBeCloseTo((5 * 3.5 + 100) / 25);
    for (let i = 1; i < s.length; i++) expect(s[i].satisfaction).toBeGreaterThan(s[i - 1].satisfaction);
  });
  it('5件未満は参考値', () => {
    expect(correctionSeries(4).map((p) => p.reference)).toEqual([true, true, true, false, false, false]);
  });
});

describe('spotBreakdown', () => {
  it('途中の値を数え、不明は回答数に入れない', () => {
    const vs = [voice('s', 5, 'unknown'), voice('s', 4, 'known'), voice('s', 3, 'unsure'), voice('t', 1, 'known')];
    const b = spotBreakdown('s', vs, 4);
    expect(b.stats.count).toBe(3);
    expect(b.sum).toBe(12);
    expect([b.knownCount, b.unknownCount, b.unsureCount, b.answered]).toEqual([1, 1, 1, 2]);
    expect(b.stats.knownRatio).toBeCloseTo(2 / 4);
  });
});
