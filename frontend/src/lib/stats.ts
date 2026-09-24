import type {
  HoleLabel, Spot, SpotId, SpotStats, StatsIndex, Tag, Town, TownId, TownStats, TownSummary, Voice, VoiceChange,
} from '../types';

/** 事前分布の重み（要件 5章の「5 ×」） */
const PRIOR_WEIGHT = 5;

export function round1(x: number): number {
  return Math.round(x * 10) / 10;
}

/** 全体の平均満足度。声0件なら 3 */
export function meanSatisfaction(voices: Voice[]): number {
  if (voices.length === 0) return 3;
  return voices.reduce((s, v) => s + v.satisfaction, 0) / voices.length;
}

export function spotStats(spotId: SpotId, spotVoices: Voice[], mean: number): SpotStats {
  const count = spotVoices.length;
  const sum = spotVoices.reduce((s, v) => s + v.satisfaction, 0);
  const satisfaction = (PRIOR_WEIGHT * mean + sum) / (PRIOR_WEIGHT + count);
  const knownCount = spotVoices.filter((v) => v.known === 'known').length;
  const answered = spotVoices.filter((v) => v.known !== 'unsure').length;
  const knownRatio = (knownCount + 1) / (answered + 2);
  const fame = 5 * knownRatio;
  return { spotId, count, satisfaction, knownRatio, fame, hole: satisfaction - fame };
}

/** 町の値 = スポットの値を件数で重み付けした平均。合計0件なら null */
export function townStats(townId: TownId, spots: SpotStats[]): TownStats | null {
  const count = spots.reduce((s, x) => s + x.count, 0);
  if (count === 0) return null;
  const w = (f: (s: SpotStats) => number) => spots.reduce((s, x) => s + f(x) * x.count, 0) / count;
  return {
    townId,
    count,
    satisfaction: w((s) => s.satisfaction),
    fame: w((s) => s.fame),
    hole: w((s) => s.hole),
  };
}

export function computeAllStats(towns: Town[], spots: Spot[], voices: Voice[]): StatsIndex {
  const mean = meanSatisfaction(voices);
  const bySpot = new Map<SpotId, Voice[]>();
  for (const v of voices) {
    const list = bySpot.get(v.spotId);
    if (list) list.push(v);
    else bySpot.set(v.spotId, [v]);
  }
  const spotIndex: Record<SpotId, SpotStats> = {};
  for (const s of spots) spotIndex[s.id] = spotStats(s.id, bySpot.get(s.id) ?? [], mean);
  const townIndex: Record<TownId, TownStats | null> = {};
  for (const t of towns) {
    townIndex[t.id] = townStats(t.id, spots.filter((s) => s.townId === t.id).map((s) => spotIndex[s.id]));
  }
  return { mean, spots: spotIndex, towns: townIndex };
}

/** 穴場ラベル（丸めた値で判定） */
export function holeLabel(hole: number): HoleLabel | null {
  const h = round1(hole);
  if (h >= 3) return 'ど穴場';
  if (h >= 2) return '穴場';
  if (h >= 1) return 'やや穴場';
  return null;
}

/** 5件未満は「参考値」（D2-3） */
export function isReference(count: number): boolean {
  return count < 5;
}

/** 候補から外す条件（丸めた値で 3.5 / 1） */
export function passesQuality(t: TownStats): { satisfaction: boolean; hole: boolean } {
  return { satisfaction: round1(t.satisfaction) >= 3.5, hole: round1(t.hole) >= 1 };
}

/** 有名地の体験のタグのうち、町のタグに含まれる割合（0〜1） */
export function matchRate(famousTags: Tag[], townTags: Tag[]): number {
  if (famousTags.length === 0) return 0;
  const set = new Set(townTags);
  return famousTags.filter((t) => set.has(t)).length / famousTags.length;
}

/** 感想を確定したときの「前 → 後」（D2-5） */
export function diffVoiceChange(
  before: StatsIndex,
  after: StatsIndex,
  beforeSummary: TownSummary | undefined,
  afterSummary: TownSummary,
  spotId: SpotId,
  townId: TownId,
): VoiceChange {
  const sb = before.spots[spotId];
  const sa = after.spots[spotId];
  const tb = before.towns[townId];
  const ta = after.towns[townId];
  const beforeCounts = new Map((beforeSummary?.tags ?? []).map((t) => [t.tag, t.count]));
  const tags = afterSummary.tags.map(({ tag, count }) => ({
    tag,
    before: beforeCounts.get(tag) ?? 0,
    after: count,
    isNew: !beforeCounts.has(tag),
  }));
  return {
    spot: {
      hole: [sb.hole, sa.hole],
      count: [sb.count, sa.count],
      satisfaction: [sb.satisfaction, sa.satisfaction],
      fame: [sb.fame, sa.fame],
    },
    town: {
      hole: [tb?.hole ?? 0, ta?.hole ?? 0],
      count: [tb?.count ?? 0, ta?.count ?? 0],
    },
    tags,
    catchphrase: [beforeSummary?.catchphrase ?? '', afterSummary.catchphrase],
  };
}
