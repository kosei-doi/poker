import { TAG_DEFS, tagIndex } from '../../data/vocab';
import type { Tag, TagCount, Town, TownSummary, Voice } from '../../types';

export const CATCHPHRASE_MAX = 15;
export const NO_TAG_CATCHPHRASE = '声を集めています';

export function countTags(voices: Voice[]): TagCount[] {
  const counts = new Map<Tag, number>();
  for (const v of voices) for (const t of v.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || tagIndex(a.tag) - tagIndex(b.tag));
}

export function makeCatchphrase(tags: Tag[]): string {
  if (tags.length === 0) return NO_TAG_CATCHPHRASE;
  const one = `${TAG_DEFS[tags[0]].phrase}の町`;
  if (tags.length === 1) return one;
  const two = `${TAG_DEFS[tags[0]].phrase}と${TAG_DEFS[tags[1]].phrase}の町`;
  return [...two].length > CATCHPHRASE_MAX ? one : two;
}

/** 町の一言とタグを作る（D5）。voices は町の声だけ */
export function summarizeTownSync(town: Town, voices: Voice[]): TownSummary {
  const counted = countTags(voices.filter((v) => v.satisfaction >= 4));
  const picked = counted.filter((t) => t.count >= 2).slice(0, 5);
  if (picked.length < 3) {
    const ones = counted.filter((t) => t.count === 1).sort((a, b) => tagIndex(a.tag) - tagIndex(b.tag));
    picked.push(...ones.slice(0, 3 - picked.length));
  }
  return { townId: town.id, catchphrase: makeCatchphrase(picked.map((t) => t.tag)), tags: picked };
}
