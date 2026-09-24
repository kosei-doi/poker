import { townById } from '../data/towns';
import type { Spot, StatsIndex, Town, TownId, Voice } from '../types';
import { findSpot, type PostedSpot } from './partner';

/** マイページ（N3）の一覧を作る純関数 */

export const EXCERPT_MAX = 40;

export interface MyVoiceRow {
  voice: Voice;
  town: Town;
  spot: Spot;
  /** 感想の先頭40字（超えたら末尾に「…」） */
  excerpt: string;
}

export interface VisitedTownRow {
  town: Town;
  myCount: number;
  /** 今の町の穴場度。声0件の町などは null */
  hole: number | null;
}

export interface MyPageSummary {
  voices: number;
  towns: number;
  favorites: number;
}

export function excerptOf(text: string, max = EXCERPT_MAX): string {
  const chars = [...text.trim()];
  return chars.length > max ? `${chars.slice(0, max).join('')}…` : chars.join('');
}

function time(iso: string): number {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

/** 自分の声の町とスポット。見つからなければ null */
function placeOf(v: Voice, postedSpots: PostedSpot[]): { spot: Spot; town: Town } | null {
  const spot = findSpot(v.spotId, postedSpots);
  const town = spot && townById(spot.townId);
  return spot && town ? { spot, town } : null;
}

/** あなたの声（N3-1）。source が 'user' の声だけ、新しい順 */
export function buildMyVoices(userVoices: Voice[], postedSpots: PostedSpot[] = []): MyVoiceRow[] {
  const rows: MyVoiceRow[] = [];
  for (const voice of userVoices) {
    if (voice.source !== 'user') continue;
    const place = placeOf(voice, postedSpots);
    if (!place) continue;
    rows.push({ voice, ...place, excerpt: excerptOf(voice.text) });
  }
  return rows.sort((a, b) => time(b.voice.createdAt) - time(a.voice.createdAt));
}

/** 行った町（N3-2）。書いた件数の多い順 → 同数は最後に書いた日時が新しい順 */
export function buildVisitedTowns(
  userVoices: Voice[],
  postedSpots: PostedSpot[],
  stats: StatsIndex,
): VisitedTownRow[] {
  const acc = new Map<TownId, { town: Town; myCount: number; last: number }>();
  for (const row of buildMyVoices(userVoices, postedSpots)) {
    const cur = acc.get(row.town.id);
    const t = time(row.voice.createdAt);
    if (cur) {
      cur.myCount += 1;
      cur.last = Math.max(cur.last, t);
    } else {
      acc.set(row.town.id, { town: row.town, myCount: 1, last: t });
    }
  }
  return [...acc.values()]
    .sort((a, b) => b.myCount - a.myCount || b.last - a.last)
    .map(({ town, myCount }) => ({ town, myCount, hole: stats.towns[town.id]?.hole ?? null }));
}

/** まとめの数字（N3-4）。行った町＝自分の声を書いた町の数 */
export function buildSummary(
  userVoices: Voice[],
  favorites: TownId[],
  postedSpots: PostedSpot[] = [],
): MyPageSummary {
  const mine = buildMyVoices(userVoices, postedSpots);
  return {
    voices: mine.length,
    towns: new Set(mine.map((r) => r.town.id)).size,
    favorites: new Set(favorites).size,
  };
}
