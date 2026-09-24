import type { DataSnapshot } from '../ai/types';
import { summarizeTownSync } from '../ai/mock/summarizeTown';
import { voicesOfTown } from '../lib/candidate';
import { computeAllStats } from '../lib/stats';
import type { Spot, TownId, TownSummary, Voice } from '../types';
import { SPOTS } from './spots';
import { TOWNS } from './towns';
import { SEED_VOICES } from './voices';

/**
 * 声から全町の一言とタグを作る（初期化時・リセット時。設計 6.1）。
 * spots には町が投稿したスポットも含めて渡す（その声も町のタグに入れるため。設計 13.15.4）
 */
export function summarizeAll(voices: Voice[], spots: Spot[] = SPOTS): Record<TownId, TownSummary> {
  const out: Record<TownId, TownSummary> = {};
  for (const town of TOWNS) {
    const tv = voicesOfTown(town.id, { spots, voices });
    if (tv.length > 0) out[town.id] = summarizeTownSync(town, tv);
  }
  return out;
}

export function buildSnapshot(voices: Voice[], summaries = summarizeAll(voices)): DataSnapshot {
  return { towns: TOWNS, spots: SPOTS, voices, stats: computeAllStats(TOWNS, SPOTS, voices), summaries };
}

export const INITIAL_VOICES = SEED_VOICES;
