import { round1, passesQuality, matchRate } from '../../lib/stats';
import { townTripCost } from '../../lib/plan';
import type { Conditions, Elimination, Recommendation, RelaxHint, RuleId, Tag, Town, TownId } from '../../types';
import type { DataSnapshot } from '../types';
import { unknownFamousNotice } from './interpret';

export const MAX_CANDIDATES = 3;
export const DAY_TRIP_LIMIT_MIN = 120;

type Rule = { id: RuleId; test: (town: Town) => string | null };

function townTags(townId: TownId, data: DataSnapshot): Tag[] {
  return data.summaries[townId]?.tags.map((t) => t.tag) ?? [];
}

function buildRules(c: Conditions, data: DataSnapshot): Rule[] {
  const spotsOf = (id: TownId) => data.spots.filter((s) => s.townId === id);
  return [
    {
      id: 'dayTrip',
      test: (t) => (c.stay === '日帰り' && t.oneWayMin > DAY_TRIP_LIMIT_MIN ? `日帰りには遠い（片道${t.oneWayMin}分）` : null),
    },
    {
      id: 'oneWay',
      test: (t) => (c.maxOneWayMin !== null && t.oneWayMin > c.maxOneWayMin ? `片道${t.oneWayMin}分かかる` : null),
    },
    {
      id: 'budget',
      test: (t) => {
        if (c.budgetYen === null) return null;
        const cost = townTripCost(t, spotsOf(t.id));
        return cost > c.budgetYen ? `予算を超える（約${cost.toLocaleString('ja-JP')}円）` : null;
      },
    },
    {
      id: 'companion',
      test: (t) => (c.companion !== null && !t.companions.includes(c.companion) ? `${c.companion}向きではない` : null),
    },
    {
      id: 'mood',
      test: (t) => {
        const tags = townTags(t.id, data);
        const missing = c.moods.find((m) => !tags.includes(m));
        return missing ? `#${missing} の声がない` : null;
      },
    },
    {
      id: 'famous',
      test: (t) =>
        c.famous !== null && matchRate(c.famous.tags, townTags(t.id, data)) === 0 ? `${c.famous.name}に似た声がない` : null,
    },
    {
      id: 'satisfaction',
      test: (t) => {
        const s = data.stats.towns[t.id];
        return s && !passesQuality(s).satisfaction ? '満足度が低い' : null;
      },
    },
    {
      id: 'hole',
      test: (t) => {
        const s = data.stats.towns[t.id];
        return s && !passesQuality(s).hole ? 'もう知られている' : null;
      },
    },
  ];
}

/** 7.4 のルールを上から当て、残った町を B3 の順に並べる */
export function applyRules(c: Conditions, data: DataSnapshot): { eliminated: Elimination[]; ranked: TownId[] } {
  let remaining = data.towns.filter((t) => data.stats.towns[t.id] !== null);
  const eliminated: Elimination[] = [];
  for (const rule of buildRules(c, data)) {
    const next: Town[] = [];
    for (const town of remaining) {
      const reason = rule.test(town);
      if (reason) eliminated.push({ townId: town.id, rule: rule.id, reason });
      else next.push(town);
    }
    remaining = next;
  }
  const order = new Map(data.towns.map((t, i) => [t.id, i]));
  const hole = (id: TownId) => round1(data.stats.towns[id]?.hole ?? 0);
  const rate = (id: TownId) => (c.famous ? matchRate(c.famous.tags, townTags(id, data)) : 0);
  const ranked = remaining
    .map((t) => t.id)
    .sort((a, b) => rate(b) - rate(a) || hole(b) - hole(a) || order.get(a)! - order.get(b)!);
  return { eliminated, ranked };
}

function ceilThousand(n: number): number {
  return Math.ceil(n / 1000) * 1000;
}

type Removal = { name: string; apply: (c: Conditions) => Conditions };

/** 外せる条件の一覧（2つ組のヒント用） */
function removals(c: Conditions): Removal[] {
  const list: Removal[] = [];
  if (c.stay === '日帰り') list.push({ name: '日帰り', apply: (x) => ({ ...x, stay: null }) });
  if (c.maxOneWayMin !== null) list.push({ name: `片道${c.maxOneWayMin}分`, apply: (x) => ({ ...x, maxOneWayMin: null }) });
  if (c.budgetYen !== null) {
    list.push({ name: `予算${c.budgetYen.toLocaleString('ja-JP')}円`, apply: (x) => ({ ...x, budgetYen: null }) });
  }
  if (c.companion !== null) list.push({ name: c.companion, apply: (x) => ({ ...x, companion: null }) });
  for (const m of c.moods) list.push({ name: `#${m}`, apply: (x) => ({ ...x, moods: x.moods.filter((y) => y !== m) }) });
  if (c.famous !== null) list.push({ name: `${c.famous.name}のたとえ`, apply: (x) => ({ ...x, famous: null }) });
  return list;
}

/** 1つ外しても0件のとき、2つ外せば出る組を町の多い順に最大3件 */
function buildPairHints(c: Conditions, data: DataSnapshot): RelaxHint[] {
  const list = removals(c);
  const out: RelaxHint[] = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const next = list[j].apply(list[i].apply(c));
      const n = applyRules(next, data).ranked.length;
      if (n === 0) continue;
      const patch: Partial<Conditions> = {};
      for (const key of Object.keys(next) as (keyof Conditions)[]) {
        if (next[key] !== c[key]) Object.assign(patch, { [key]: next[key] });
      }
      out.push({ rule: null, label: `「${list[i].name}」と「${list[j].name}」を外す`, townCount: n, patch });
    }
  }
  return out.sort((a, b) => b.townCount - a.townCount).slice(0, 3);
}

/** 0件のとき、どの条件を緩めれば出るか（設計 4.3） */
export function buildRelaxHints(c: Conditions, data: DataSnapshot): RelaxHint[] {
  const hints: RelaxHint[] = [];
  const count = (cc: Conditions) => applyRules(cc, data).ranked.length;
  const passingTowns = (cc: Conditions) => applyRules(cc, data).ranked.map((id) => data.towns.find((t) => t.id === id)!);

  if (c.stay === '日帰り') {
    const n = count({ ...c, stay: '泊まり' });
    if (n > 0) hints.push({ rule: 'dayTrip', label: '泊まりにする', townCount: n, patch: { stay: '泊まり' } });
  }
  if (c.maxOneWayMin !== null) {
    const towns = passingTowns({ ...c, maxOneWayMin: null });
    if (towns.length > 0) {
      const m = Math.min(...towns.map((t) => t.oneWayMin));
      hints.push({
        rule: 'oneWay', label: `片道を${m}分以内にする`, townCount: count({ ...c, maxOneWayMin: m }), patch: { maxOneWayMin: m },
      });
    }
  }
  if (c.budgetYen !== null) {
    const towns = passingTowns({ ...c, budgetYen: null });
    if (towns.length > 0) {
      const cost = ceilThousand(Math.min(...towns.map((t) => townTripCost(t, data.spots.filter((s) => s.townId === t.id)))));
      hints.push({
        rule: 'budget',
        label: `予算を約${cost.toLocaleString('ja-JP')}円にする`,
        townCount: count({ ...c, budgetYen: cost }),
        patch: { budgetYen: cost },
      });
    }
  }
  if (c.companion !== null) {
    const n = count({ ...c, companion: null });
    if (n > 0) hints.push({ rule: 'companion', label: `「${c.companion}」を外す`, townCount: n, patch: { companion: null } });
  }
  for (const mood of c.moods) {
    const n = count({ ...c, moods: c.moods.filter((m) => m !== mood) });
    if (n > 0) hints.push({ rule: 'mood', label: `#${mood} を外す`, townCount: n, patch: { moods: c.moods.filter((m) => m !== mood) } });
  }
  if (c.famous !== null) {
    const n = count({ ...c, famous: null });
    if (n > 0) hints.push({ rule: 'famous', label: `「${c.famous.name}」のたとえを外す`, townCount: n, patch: { famous: null } });
  }
  if (hints.length === 0) hints.push(...buildPairHints(c, data));
  if (hints.length === 0) hints.push({ rule: null, label: '条件を3つ以上緩めてください', townCount: 0, patch: null });
  return hints;
}

/** 町を絞り込み、提案と理由を返す（B3・D1-3・D4-2） */
export function recommendSync(c: Conditions, data: DataSnapshot): Recommendation {
  const { eliminated, ranked } = applyRules(c, data);
  const candidateIds = ranked.slice(0, MAX_CANDIDATES);
  const overflow: Elimination[] = ranked
    .slice(MAX_CANDIDATES)
    .map((townId) => ({ townId, rule: 'rank', reason: '上位3町に入らなかった' }));
  return {
    eliminated: [...eliminated, ...overflow],
    candidateIds,
    relaxHints: candidateIds.length === 0 ? buildRelaxHints(c, data) : [],
    notices: c.unknownFamous ? [unknownFamousNotice(c.unknownFamous)] : [],
  };
}
