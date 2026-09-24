import { COMPLAINT_WORDS } from '../../data/dictionaries';
import { TAG_DEFS } from '../../data/vocab';
import type { Town, TownReport, Voice } from '../../types';
import { countTags } from './summarizeTown';

export function buildPitch(townName: string, report: Pick<TownReport, 'goodPoints'>): string | null {
  const [a, b] = report.goodPoints;
  if (!a) return null;
  if (!b) return `知らずに訪れた人が『${TAG_DEFS[a.tag].phrase}』に満足した町、${townName}。`;
  return `知らずに訪れた人が『${TAG_DEFS[a.tag].phrase}』と『${TAG_DEFS[b.tag].phrase}』に満足した町、${townName}。`;
}

/** 町向けレポートを作る（D3-1）。voices は町の声だけ */
export function buildReportSync(town: Town, voices: Voice[]): TownReport {
  const goodPoints = countTags(voices.filter((v) => v.known === 'unknown' && v.satisfaction >= 4)).slice(0, 3);
  const low = voices.filter((v) => v.satisfaction <= 2);
  const complaints = COMPLAINT_WORDS.map(({ word, variants }) => ({
    word,
    count: low.filter((v) => variants.some((x) => v.text.includes(x))).length,
  }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
  return { townId: town.id, goodPoints, complaints, pitch: buildPitch(town.name, { goodPoints }) };
}
