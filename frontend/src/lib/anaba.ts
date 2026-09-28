import type { Region, Plan, PlanStep, Filters, Vibe, WithWhom } from '../types';

/** 穴場度：満足度 − 知名度。編集部が選ぶのではなく計算で出す、という主張の実体。 */
export const anabaScore = (r: Region) => Math.round((r.satisfaction - r.fame) * 10) / 10;

export const anabaLabel = (s: number) =>
  s >= 3 ? 'ど穴場' : s >= 2 ? '穴場' : s >= 1 ? 'やや穴場' : '知られている';

export const VIBES: { key: Vibe; label: string }[] = [
  { key: 'nature', label: '自然' },
  { key: 'food', label: '食' },
  { key: 'craft', label: '手仕事' },
  { key: 'night', label: '夜' },
  { key: 'history', label: '歴史' },
];

export const WHOM: { key: WithWhom; label: string }[] = [
  { key: 'friends', label: '友達と' },
  { key: 'solo', label: 'ひとり' },
  { key: 'couple', label: 'ふたり' },
  { key: 'family', label: '家族と' },
];

export const KIND_LABEL: Record<string, string> = {
  event: '催し', food: '食べる', photo: '撮る', stay: '泊まる',
};

export const filterRegions = (regions: Region[], f: Filters) =>
  regions
    .filter((r) => r.access.minutes <= f.maxMinutes)
    .filter((r) => r.budget <= f.maxBudget)
    .filter((r) => f.withWhom === 'any' || r.withWhom.includes(f.withWhom))
    .filter((r) => f.vibe === 'any' || r.vibes.includes(f.vibe))
    .sort((a, b) => anabaScore(b) - anabaScore(a));

const addMinutes = (hhmm: string, min: number) => {
  const [h, m] = hhmm.split(':').map(Number);
  const t = h * 60 + m + min;
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};

/**
 * 1日分の計画を組む。
 * 催し→食→撮影の順に、夜の催しは最後へ。移動は各30分で見込む。
 */
export const buildPlan = (region: Region, startAt = '10:00'): Plan => {
  const night = region.places.filter((p) => /夜|灯籠|BAR|星空/.test(p.name + p.desc));
  const day = region.places.filter((p) => !night.includes(p));

  const order = [
    ...day.filter((p) => p.kind === 'event'),
    ...day.filter((p) => p.kind === 'food'),
    ...day.filter((p) => p.kind === 'photo'),
    ...night,
  ];

  let cursor = startAt;
  const steps: PlanStep[] = order.map((place, i) => {
    const time = cursor;
    cursor = addMinutes(cursor, place.stay + (i < order.length - 1 ? 30 : 0));
    return {
      time,
      place,
      note:
        place.kind === 'food' ? 'ここで昼を挟むと、午後が軽くなります'
        : place.kind === 'photo' ? '滞在は短め。移動のついでに寄れます'
        : place.period ? `この日程でしか開いていません（${place.period}）`
        : '主役。ここに時間を多めに取っています',
    };
  });

  const total = order.reduce((a, p) => a + p.stay, 0) + Math.max(0, order.length - 1) * 30;

  return {
    regionId: region.id,
    title: `${region.name}の1日`,
    steps,
    totalMinutes: total,
    budget: region.budget,
    transport: region.access.mode,
  };
};

export const fmtDuration = (min: number) =>
  min >= 60 ? `${Math.floor(min / 60)}時間${min % 60 ? `${min % 60}分` : ''}` : `${min}分`;
