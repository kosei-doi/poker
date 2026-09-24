import type { DataSnapshot } from '../ai/types';
import { summarizeTownSync } from '../ai/mock/summarizeTown';
import { voicesOfTown } from '../lib/candidate';
import { computeAllStats } from '../lib/stats';
import type { Conditions, Known, Satisfaction, Spot, Tag, Town, TownSummary, Voice } from '../types';

let seq = 0;
export function voice(
  spotId: string,
  satisfaction: Satisfaction,
  known: Known = 'unsure',
  tags: Tag[] = [],
  opts: Partial<Voice> = {},
): Voice {
  seq += 1;
  return {
    id: `v${seq}`,
    spotId,
    text: opts.text ?? `感想${seq}`,
    satisfaction,
    known,
    tags,
    evidence: opts.evidence ?? `根拠${seq}`,
    createdAt: opts.createdAt ?? new Date(Date.UTC(2026, 5, 1) + seq * 60000).toISOString(),
    source: 'seed',
    ...opts,
  };
}

export function town(id: string, over: Partial<Town> = {}): Town {
  return {
    id, name: `${id}町`, code: id, oneWayMin: 60, roundTripYen: 5000,
    companions: ['友達と', 'ひとり', 'ふたり', '家族と'], labelPoint: [0, 0], ...over,
  };
}

export function spot(id: string, townId: string, over: Partial<Spot> = {}): Spot {
  return {
    id, townId, name: id, kind: '見る', description: '', lat: 0, lng: 0,
    order: 1, stayMin: 60, moveMin: 10, costYen: 0, ...over,
  };
}

export function emptyConditions(over: Partial<Conditions> = {}): Conditions {
  return {
    companion: null, partySize: null, stay: null, budgetYen: null, maxOneWayMin: null,
    moods: [], famous: null, unknownFamous: null, ...over,
  };
}

export function snapshot(towns: Town[], spots: Spot[], voices: Voice[], summaries?: Record<string, TownSummary>): DataSnapshot {
  const s: Record<string, TownSummary> = summaries ?? {};
  if (!summaries) {
    for (const t of towns) {
      const tv = voicesOfTown(t.id, { spots, voices });
      if (tv.length > 0) s[t.id] = summarizeTownSync(t, tv);
    }
  }
  return { towns, spots, voices, stats: computeAllStats(towns, spots, voices), summaries: s };
}

/** n 件の同じ声 */
export function many(n: number, make: () => Voice): Voice[] {
  return Array.from({ length: n }, make);
}
