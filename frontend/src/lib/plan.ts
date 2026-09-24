import type { Conditions, Spot, Town } from '../types';

export const PLAN_START_MIN = 10 * 60;

/** 往復交通費 + スポット費用の合計（1人。要件 7.4 の予算判定と B4 で共用） */
export function townTripCost(town: Town, townSpots: Spot[]): number {
  return town.roundTripYen + townSpots.reduce((s, x) => s + x.costYen, 0);
}

export interface PlanRow {
  spot: Spot;
  start: string;
  stayMin: number;
  moveMin: number;
  costYen: number;
}

export interface DayPlan {
  title: '1日プラン' | '1日目のプラン';
  rows: PlanRow[];
  totalYen: number;
  overBudget: boolean;
}

export function clock(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

export function buildDayPlan(town: Town, townSpots: Spot[], conditions: Conditions | null): DayPlan {
  const ordered = [...townSpots].sort((a, b) => a.order - b.order);
  let t = PLAN_START_MIN;
  const rows = ordered.map((spot, i) => {
    const moveMin = i === ordered.length - 1 ? 0 : spot.moveMin;
    const row: PlanRow = { spot, start: clock(t), stayMin: spot.stayMin, moveMin, costYen: spot.costYen };
    t += spot.stayMin + moveMin;
    return row;
  });
  const totalYen = townTripCost(town, ordered);
  const budget = conditions?.budgetYen ?? null;
  return {
    title: conditions?.stay === '泊まり' ? '1日目のプラン' : '1日プラン',
    rows,
    totalYen,
    overBudget: budget !== null && totalYen > budget,
  };
}
