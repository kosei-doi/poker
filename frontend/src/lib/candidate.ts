import type { DataSnapshot } from '../ai/types';
import type { CandidateView, Conditions, Tag, TownId, Voice } from '../types';
import { matchRate } from './stats';

const byNewest = (a: Voice, b: Voice) => Date.parse(b.createdAt) - Date.parse(a.createdAt);

/** 町に属する声 */
export function voicesOfTown(townId: TownId, data: Pick<DataSnapshot, 'spots' | 'voices'>): Voice[] {
  const spotIds = new Set(data.spots.filter((s) => s.townId === townId).map((s) => s.id));
  return data.voices.filter((v) => spotIds.has(v.spotId));
}

/** 根拠の声（D2-4）: 知らなかった×満足度4以上を新しい順 → 足りなければ満足度4以上で補う。最大3件 */
export function selectQuotes(townVoices: Voice[]): Voice[] {
  const good = townVoices.filter((v) => v.satisfaction >= 4).sort(byNewest);
  const first = good.filter((v) => v.known === 'unknown');
  const rest = good.filter((v) => v.known !== 'unknown');
  return [...first, ...rest].slice(0, 3);
}

/** 似ている理由の裏付けの声（D4-2）: 共通タグ数 → 知らなかった優先 → 新しい順 */
export function selectFamousEvidence(townVoices: Voice[], matchedTags: Tag[]): Voice | null {
  if (matchedTags.length === 0) return null;
  const matched = new Set(matchedTags);
  const scored = townVoices
    .filter((v) => v.satisfaction >= 4)
    .map((v) => ({ v, common: v.tags.filter((t) => matched.has(t)).length }))
    .filter((x) => x.common > 0);
  scored.sort(
    (a, b) =>
      b.common - a.common ||
      Number(b.v.known === 'unknown') - Number(a.v.known === 'unknown') ||
      byNewest(a.v, b.v),
  );
  return scored[0]?.v ?? null;
}

/** 根拠の声を引用した理由の文。声がなければ null（声で裏付けられない文は出さない） */
export function buildReasonText(townVoices: Voice[], quotes: Voice[]): string | null {
  if (quotes.length === 0) return null;
  const n = townVoices.filter((v) => v.known === 'unknown' && v.satisfaction >= 4).length;
  if (n >= 1) return `知らずに訪れて満足した人が${n}人。『${quotes[0].evidence}』`;
  return `訪れた人の声:『${quotes[0].evidence}』`;
}

/**
 * 提案カードの中身を今の voices・summaries・stats から作る（設計 決定#10）。
 * 声0件の町は呼ばない（stats が null のため）。
 */
export function buildCandidateView(townId: TownId, conditions: Conditions | null, data: DataSnapshot): CandidateView | null {
  const stats = data.stats.towns[townId];
  const summary = data.summaries[townId];
  if (!stats || !summary) return null;
  const townVoices = voicesOfTown(townId, data);
  const townTags = summary.tags.map((t) => t.tag);
  const famous = conditions?.famous ?? null;
  const matchedTags = famous ? famous.tags.filter((t) => townTags.includes(t)) : [];
  const quotes = selectQuotes(townVoices);
  return {
    townId,
    stats,
    summary,
    matchRate: famous ? matchRate(famous.tags, townTags) : null,
    matchedTags,
    famousEvidence: famous ? selectFamousEvidence(townVoices, matchedTags) : null,
    quotes,
    reasonText: buildReasonText(townVoices, quotes),
  };
}
