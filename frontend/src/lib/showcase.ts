import type { DataSnapshot } from '../ai/types';
import { TAGS } from '../types';
import type { Spot, Tag, Town, TownId, TownStats, TownSummary, Voice } from '../types';
import { selectQuotes, voicesOfTown } from './candidate';

/** ダッシュボードのタグを自動で切り替える間隔（N7-2） */
export const SHOWCASE_INTERVAL_MS = 6000;

/** 町のタグ（D5-2）に1町以上含まれるタグを語彙の順で（N7-2） */
export function showcaseTags(summaries: Record<TownId, TownSummary>): Tag[] {
  const present = new Set<Tag>();
  for (const s of Object.values(summaries)) for (const t of s.tags) present.add(t.tag);
  return TAGS.filter((t) => present.has(t));
}

export interface ShowcaseRow {
  town: Town;
  summary: TownSummary;
  stats: TownStats;
  /** そのタグの元になった声の件数（summary.tags の count） */
  tagCount: number;
  /** そのタグを含む根拠の声1件（D2-4 の選び方） */
  evidence: Voice | null;
  /** そのタグを持つスポット 1〜3件（満足度4以上でそのタグを含む声の件数の多い順） */
  spots: { spot: Spot; count: number }[];
}

/** 今のタグを持つ町を穴場度の高い順（同じなら towns の順）に並べる（N7-3） */
export function showcaseRows(tag: Tag, data: DataSnapshot): ShowcaseRow[] {
  const rows: { row: ShowcaseRow; order: number }[] = [];
  data.towns.forEach((town, order) => {
    const stats = data.stats.towns[town.id];
    const summary = data.summaries[town.id];
    if (!stats || !summary) return;
    const tagEntry = summary.tags.find((t) => t.tag === tag);
    if (!tagEntry) return;

    const tagged = voicesOfTown(town.id, data).filter((v) => v.tags.includes(tag));
    const evidence = selectQuotes(tagged)[0] ?? null;

    // 投稿したスポットも data.spots に入っているので、ここで一緒に数える
    const spots = data.spots
      .filter((s) => s.townId === town.id)
      .map((spot) => ({
        spot,
        count: data.voices.filter((v) => v.spotId === spot.id && v.satisfaction >= 4 && v.tags.includes(tag)).length,
      }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count) // 安定ソートなので同数は元の並び
      .slice(0, 3);

    rows.push({ row: { town, summary, stats, tagCount: tagEntry.count, evidence, spots }, order });
  });
  rows.sort((a, b) => b.row.stats.hole - a.row.stats.hole || a.order - b.order);
  return rows.map((r) => r.row);
}

/** 0..length-1 の中で dir だけ進め、端で折り返す */
export function stepIndex(index: number, length: number, dir: 1 | -1): number {
  if (length <= 0) return 0;
  return (((index + dir) % length) + length) % length;
}
