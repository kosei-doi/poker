import { describe, expect, it } from 'vitest';
import type { Elimination } from '../types';
import { buildNarrowingTimeline } from './timeline';

const elim = (n: number): Elimination[] =>
  Array.from({ length: n }, (_, i) => ({ townId: `t${i}`, rule: 'mood', reason: `r${i}` }));

describe('buildNarrowingTimeline', () => {
  it('デモ（2町が暗くなる）: 500 に条件、500・1100 に暗転、3500 に光', () => {
    const ev = buildNarrowingTimeline(elim(2), ['a', 'b', 'c'], { reducedMotion: false, origin: 'send' });
    expect(ev.map((e) => [e.type, e.at])).toEqual([
      ['showConditions', 500],
      ['dim', 500],
      ['dim', 1100],
      ['light', 3500],
    ]);
  });
  it.each([0, 1, 2, 3, 4, 5])('n=%i: 暗転は 500〜3000 で時刻順、光は 3500 以下', (n) => {
    const ev = buildNarrowingTimeline(elim(n), ['a'], { reducedMotion: false, origin: 'send' });
    const dims = ev.filter((e) => e.type === 'dim');
    expect(dims).toHaveLength(n);
    const step = n > 0 ? Math.min(600, 2500 / n) : 0;
    dims.forEach((d, k) => expect(d.at).toBe(Math.round(500 + k * step)));
    for (let i = 1; i < dims.length; i++) expect(dims[i].at).toBeGreaterThan(dims[i - 1].at);
    dims.forEach((d) => {
      expect(d.at).toBeGreaterThanOrEqual(500);
      expect(d.at).toBeLessThanOrEqual(3000);
    });
    ev.forEach((e) => expect(e.at).toBeLessThanOrEqual(3500));
  });
  it('動きを減らす設定では一度に暗くし、同時に光を当てる', () => {
    const ev = buildNarrowingTimeline(elim(3), ['a'], { reducedMotion: true, origin: 'send' });
    expect(ev.map((e) => [e.type, e.at])).toEqual([
      ['showConditions', 500],
      ['dim', 500],
      ['light', 500],
    ]);
    const dim = ev[1];
    expect(dim.type === 'dim' && dim.townIds).toEqual(['t0', 't1', 't2']);
  });
  it('rerun は条件表示を省き、全体を 500 早める', () => {
    const ev = buildNarrowingTimeline(elim(2), ['a'], { reducedMotion: false, origin: 'rerun' });
    expect(ev.map((e) => [e.type, e.at])).toEqual([
      ['dim', 0],
      ['dim', 600],
      ['light', 3000],
    ]);
  });
  it('0件のときは最後の暗転の 500ms 後に empty', () => {
    const ev = buildNarrowingTimeline(elim(2), [], { reducedMotion: false, origin: 'send' });
    expect(ev.at(-1)).toEqual({ at: 1600, type: 'empty' });
  });
});
