import type { SpotId, SpotStats, Voice } from '../types';
import { isReference, spotStats } from './stats';

/** 補正の図で使う件数（設計 13.8.4） */
export const CORRECTION_NS = [1, 2, 3, 5, 10, 20] as const;

export interface SpotBreakdown {
  stats: SpotStats;
  /** 満足度の合計 */
  sum: number;
  knownCount: number;
  unknownCount: number;
  unsureCount: number;
  /** 知っていた・知らなかったの回答数（不明は数えない） */
  answered: number;
}

/** スポットの式の途中の値（値そのものは stats.ts の spotStats で出す） */
export function spotBreakdown(spotId: SpotId, voices: Voice[], mean: number): SpotBreakdown {
  const own = voices.filter((v) => v.spotId === spotId);
  const knownCount = own.filter((v) => v.known === 'known').length;
  const unknownCount = own.filter((v) => v.known === 'unknown').length;
  return {
    stats: spotStats(spotId, own, mean),
    sum: own.reduce((s, v) => s + v.satisfaction, 0),
    knownCount,
    unknownCount,
    unsureCount: own.length - knownCount - unknownCount,
    answered: knownCount + unknownCount,
  };
}

export interface CorrectionPoint {
  n: number;
  satisfaction: number;
  reference: boolean;
}

/** 「満足度5の声だけが n 件あるスポット」の補正後の満足度 */
export function correctionSeries(mean: number, ns: readonly number[] = CORRECTION_NS): CorrectionPoint[] {
  return ns.map((n) => {
    const vs: Voice[] = Array.from({ length: n }, (_, i) => ({
      id: `about-${i}`,
      spotId: 'about',
      text: '',
      satisfaction: 5,
      known: 'unsure',
      tags: [],
      evidence: '',
      createdAt: '',
      source: 'seed',
    }));
    return { n, satisfaction: spotStats('about', vs, mean).satisfaction, reference: isReference(n) };
  });
}
