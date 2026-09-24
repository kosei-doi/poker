import { COMPANION_RULES } from '../../data/dictionaries';
import { FAMOUS_PLACES } from '../../data/famous';
import { detectTags, TAG_DEFS } from '../../data/vocab';
import { normalizeText } from '../../lib/text';
import type { Companion, Conditions, FamousPlace, InterpretResult, Stay } from '../../types';

export const CLARIFY_QUESTION = '誰と、どんな雰囲気のところに行きたいですか？';

export function unknownFamousNotice(name: string): string {
  return `『${name}』はまだ対応していないので、ほかの条件で探しました`;
}

const ALIAS_INDEX: { alias: string; place: FamousPlace }[] = FAMOUS_PLACES.flatMap((place) =>
  place.aliases.map((alias) => ({ alias, place })),
).sort((a, b) => b.alias.length - a.alias.length);

const SIMILE = /(みたいな|みたいに|みたいの|っぽい|のような|のように)/;
const CHUNK_BREAK = /[、。，,.！!？?\s「」『』()（）]/;
const PARTICLES = /[はがをにでもへとや]/;

const ALL_TAG_WORDS = Object.values(TAG_DEFS)
  .flatMap((d) => d.words)
  .sort((a, b) => b.length - a.length);

/** 語が判定語だけでできているか（「海」「竹林」→ true、「ハワイ」「富良野」→ false） */
function isOnlyTagWords(word: string): boolean {
  let rest = word;
  for (const w of ALL_TAG_WORDS) rest = rest.split(w).join('');
  return rest.length === 0;
}

function findFamous(text: string): { place: FamousPlace; alias: string } | null {
  for (const { alias, place } of ALIAS_INDEX) if (text.includes(alias)) return { place, alias };
  return null;
}

/** 「〇〇みたいな」の〇〇を切り出す（設計 4.2 ③） */
export function extractSimileTarget(text: string): string | null {
  const m = SIMILE.exec(text);
  if (!m) return null;
  let before = text.slice(0, m.index);
  const cut = [...before].reduceRight((found, ch, i) => (found < 0 && CHUNK_BREAK.test(ch) ? i : found), -1);
  if (cut >= 0) before = before.slice(cut + 1);
  const pieces = before.split(PARTICLES).filter((p) => p.length > 0);
  const target = pieces[pieces.length - 1] ?? '';
  return target.length > 0 ? target : null;
}

function findCompanion(text: string): Companion | null {
  for (const { companion, pattern } of COMPANION_RULES) if (pattern.test(text)) return companion;
  return null;
}

function findPartySize(text: string): number | null {
  const m = /(?<!\d)(\d+)人/.exec(text);
  if (m) return Number(m[1]);
  if (text.includes('ひとり')) return 1;
  if (text.includes('ふたり')) return 2;
  return null;
}

function findStay(text: string): Stay | null {
  if (text.includes('日帰り')) return '日帰り';
  if (/泊|宿/.test(text)) return '泊まり';
  return null;
}

function toYen(num: string, unit: string | undefined): number {
  const n = Number(num);
  if (unit === '万') return Math.round(n * 10000);
  if (unit === '千') return Math.round(n * 1000);
  return Math.round(n);
}

function findBudget(text: string): number | null {
  const withYen = /(\d+(?:\.\d+)?)\s*(万|千)?\s*円/.exec(text.replace(/(\d),(\d{3})/g, '$1$2'));
  if (withYen) return toYen(withYen[1], withYen[2]);
  const man = /(\d+(?:\.\d+)?)\s*万/.exec(text);
  if (man) return toYen(man[1], '万');
  return null;
}

function findMaxOneWay(text: string): number | null {
  const h = /(\d+(?:\.\d+)?)\s*時間(半)?以内/.exec(text);
  if (h) return Math.round(Number(h[1]) * 60) + (h[2] ? 30 : 0);
  const m = /(\d+)\s*分以内/.exec(text);
  if (m) return Number(m[1]);
  return null;
}

/** 相談文から条件と有名地のたとえを読み取る（B2・D4-1・D4-3） */
export function interpretSync(input: string): InterpretResult {
  const text = normalizeText(input);
  let rest = text;

  const hit = findFamous(text);
  let unknownFamous: string | null = null;
  if (hit) {
    rest = rest.split(hit.alias).join('　');
  } else {
    const target = extractSimileTarget(text);
    // 〇〇が語彙の判定語だけでできている（「海っぽい」「静かな感じ」など）なら、有名地ではなく雰囲気として読む
    const isMoodWord = target !== null && isOnlyTagWords(target);
    if (target && !isMoodWord) {
      unknownFamous = target;
      rest = rest.split(target).join('　');
    }
  }

  const conditions: Conditions = {
    companion: findCompanion(text),
    partySize: findPartySize(text),
    stay: findStay(text),
    budgetYen: findBudget(text),
    maxOneWayMin: findMaxOneWay(text),
    moods: detectTags(rest).tags,
    famous: hit?.place ?? null,
    unknownFamous,
  };

  const nothing =
    conditions.companion === null &&
    conditions.partySize === null &&
    conditions.stay === null &&
    conditions.budgetYen === null &&
    conditions.maxOneWayMin === null &&
    conditions.moods.length === 0 &&
    conditions.famous === null;
  if (nothing) {
    const question = unknownFamous ? `${unknownFamousNotice(unknownFamous)}。${CLARIFY_QUESTION}` : CLARIFY_QUESTION;
    return { kind: 'clarify', question };
  }
  return { kind: 'conditions', conditions };
}
