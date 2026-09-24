import type { Elimination, TownId } from '../types';

export type TimelineEvent =
  | { at: number; type: 'showConditions' }
  | { at: number; type: 'dim'; townIds: TownId[]; reasons: Elimination[] }
  | { at: number; type: 'light'; townIds: TownId[] }
  | { at: number; type: 'empty' };

/** 送信から条件タグを出すまで（要件 6章） */
export const CONDITIONS_AT = 500;
/** 最後の暗転の上限 */
export const LAST_DIM_AT = 3000;
/** 光を当てる時刻 */
export const LIGHT_AT = 3500;
const MAX_STEP = 600;
const EMPTY_DELAY = 500;

/**
 * 絞り込み演出の時刻表（設計 8.4）。at は送信時刻（rerun は再実行した時刻）からのミリ秒。
 * reducedMotion のときは一度に暗くし、同時に光を当てる。
 */
export function buildNarrowingTimeline(
  eliminated: Elimination[],
  litTownIds: TownId[],
  opts: { reducedMotion: boolean; origin: 'send' | 'rerun' },
): TimelineEvent[] {
  const shift = opts.origin === 'rerun' ? -CONDITIONS_AT : 0;
  const events: TimelineEvent[] = [];
  if (opts.origin === 'send') events.push({ at: CONDITIONS_AT, type: 'showConditions' });

  if (opts.reducedMotion) {
    const at = opts.origin === 'send' ? CONDITIONS_AT : 0;
    if (eliminated.length > 0) events.push({ at, type: 'dim', townIds: eliminated.map((e) => e.townId), reasons: eliminated });
    events.push(litTownIds.length > 0 ? { at, type: 'light', townIds: litTownIds } : { at, type: 'empty' });
    return events;
  }

  const n = eliminated.length;
  const step = n > 0 ? Math.min(MAX_STEP, (LAST_DIM_AT - CONDITIONS_AT) / n) : 0;
  eliminated.forEach((e, k) => {
    events.push({ at: Math.round(CONDITIONS_AT + k * step) + shift, type: 'dim', townIds: [e.townId], reasons: [e] });
  });
  if (litTownIds.length > 0) {
    events.push({ at: LIGHT_AT + shift, type: 'light', townIds: litTownIds });
  } else {
    const lastDim = n > 0 ? Math.round(CONDITIONS_AT + (n - 1) * step) + shift : CONDITIONS_AT + shift;
    events.push({ at: lastDim + EMPTY_DELAY, type: 'empty' });
  }
  return events;
}
