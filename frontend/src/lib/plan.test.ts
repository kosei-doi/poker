import { describe, expect, it } from 'vitest';
import { emptyConditions, spot, town } from '../test/fixtures';
import { buildDayPlan, clock, townTripCost } from './plan';

const t = town('t', { roundTripYen: 8000 });
const spots = [
  spot('b', 't', { order: 2, stayMin: 60, moveMin: 10, costYen: 1200 }),
  spot('a', 't', { order: 1, stayMin: 50, moveMin: 15, costYen: 0 }),
  spot('c', 't', { order: 3, stayMin: 45, moveMin: 99, costYen: 300 }),
];

describe('buildDayPlan', () => {
  it('10:00 開始で、前のスポットの滞在と移動を足して時刻を出す', () => {
    const plan = buildDayPlan(t, spots, null);
    expect(plan.rows.map((r) => [r.spot.id, r.start])).toEqual([
      ['a', '10:00'],
      ['b', '11:05'],
      ['c', '12:15'],
    ]);
    // 最後のスポットの移動時間は 0
    expect(plan.rows[2].moveMin).toBe(0);
    expect(plan.title).toBe('1日プラン');
  });
  it('合計は往復交通費＋スポットの費用', () => {
    expect(townTripCost(t, spots)).toBe(9500);
    expect(buildDayPlan(t, spots, null).totalYen).toBe(9500);
  });
  it('予算を超えると警告', () => {
    expect(buildDayPlan(t, spots, emptyConditions({ budgetYen: 9000 })).overBudget).toBe(true);
    expect(buildDayPlan(t, spots, emptyConditions({ budgetYen: 9500 })).overBudget).toBe(false);
    expect(buildDayPlan(t, spots, emptyConditions()).overBudget).toBe(false);
  });
  it('泊まりは「1日目のプラン」', () => {
    expect(buildDayPlan(t, spots, emptyConditions({ stay: '泊まり' })).title).toBe('1日目のプラン');
  });
  it('clock', () => {
    expect(clock(605)).toBe('10:05');
    expect(clock(780)).toBe('13:00');
  });
});
