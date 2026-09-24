import type { PlanPreferences, Spot, TripPlan, TripPlanItem } from '../types';
import { CATEGORY_MAP } from './categoryHelpers';
import { countFootprints, hiddenGemScore } from './spotStats';

export type PlanResult =
  | { source: 'ai'; plan: TripPlan }
  | { source: 'demo'; plan: TripPlan; reason: string };

/** AI にはスポットの要点だけを渡す（画像URLや足跡の本文は不要） */
function summarizeSpots(spots: Spot[]) {
  return spots.map((s) => {
    const { local, visitor } = countFootprints(s);
    return {
      id: s.id,
      name: s.name,
      category: CATEGORY_MAP[s.category].label,
      area: s.area,
      description: s.description,
      localTip: s.localTip,
      bestTime: s.bestTime,
      stayMinutes: s.stayMinutes,
      tags: s.tags,
      localFootprints: local,
      visitorFootprints: visitor,
    };
  });
}

export async function requestPlan(prefs: PlanPreferences, spots: Spot[]): Promise<PlanResult> {
  const candidates =
    prefs.area === 'すべて' ? spots : spots.filter((s) => s.area === prefs.area || s.id === prefs.mustIncludeSpotId);
  try {
    const res = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences: prefs, spots: summarizeSpots(candidates) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.plan) {
      throw new Error(data.error ?? `サーバーエラー (${res.status})`);
    }
    return { source: 'ai', plan: data.plan as TripPlan };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'AIサーバーに接続できませんでした';
    return { source: 'demo', plan: buildDemoPlan(prefs, candidates), reason };
  }
}

// ---- AI が使えないときのルールベース生成（デモ用） ----

const INTEREST_TO_CATEGORY: Record<string, string[]> = {
  食: ['gourmet'],
  自然: ['nature', 'view'],
  絶景: ['view'],
  温泉: ['onsen'],
  体験: ['craft'],
  歴史: ['history'],
};

function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
function toTime(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

export function buildDemoPlan(prefs: PlanPreferences, spots: Spot[]): TripPlan {
  const wanted = new Set(prefs.interests.flatMap((i) => INTEREST_TO_CATEGORY[i] ?? []));
  const ranked = [...spots].sort((a, b) => {
    const score = (s: Spot) =>
      (s.id === prefs.mustIncludeSpotId ? 1000 : 0) + (wanted.has(s.category) ? 100 : 0) + hiddenGemScore(s);
    return score(b) - score(a);
  });

  const dayCount = prefs.duration.includes('2泊') ? 3 : prefs.duration.includes('1泊') ? 2 : 1;
  const perDay = prefs.pace === 'ゆったり' ? 3 : prefs.pace === 'よくばり' ? 5 : 4;
  const move = prefs.transport === '車' ? 20 : 35;

  const days = Array.from({ length: dayCount }, (_, d) => {
    // 行ったり来たりしないよう、1日分は北から南へ並べる
    const picks = ranked.slice(d * perDay, (d + 1) * perDay).sort((a, b) => b.lat - a.lat);
    let clock = toMinutes('09:00');
    const items: TripPlanItem[] = [];
    picks.forEach((s, i) => {
      if (i === 2) {
        items.push({
          time: toTime(clock),
          spotId: null,
          title: '地元の食堂でランチ',
          description: 'スポットで出会った人におすすめの店を聞いてみましょう。',
          localTip: null,
          transport: null,
          durationMin: 60,
        });
        clock += 60 + move;
      }
      items.push({
        time: toTime(clock),
        spotId: s.id,
        title: s.name,
        description: s.catchphrase,
        localTip: s.localTip,
        transport: i === 0 ? null : `${prefs.transport}で約${move}分`,
        durationMin: s.stayMinutes,
      });
      clock += s.stayMinutes + move;
    });
    return { day: d + 1, theme: d === 0 ? '地元の人の日常にお邪魔する' : 'もう一歩深く、土地の暮らしへ', items };
  });

  return {
    title: `${prefs.area === 'すべて' ? '北アルプス山麓' : prefs.area}の穴場めぐり ${prefs.duration}`,
    summary: '地元の人の足跡が多く、まだ旅人に知られていない「穴場度」の高いスポットを優先して組み立てたプランです。',
    highlights: ranked.slice(0, 3).map((s) => `${CATEGORY_MAP[s.category].emoji} ${s.name}`),
    days,
    tips: ['訪れた場所では「足跡」を残して、次の旅人と地域の人にバトンをつなぎましょう。'],
  };
}
