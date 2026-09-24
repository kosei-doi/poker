import { describe, expect, it } from 'vitest';
import { DEMO_CONSULT } from '../../data/examples';
import type { Conditions } from '../../types';
import { CLARIFY_QUESTION, extractSimileTarget, interpretSync } from './interpret';

function cond(text: string): Conditions {
  const r = interpretSync(text);
  if (r.kind !== 'conditions') throw new Error(`clarify: ${text}`);
  return r.conditions;
}

describe('interpret', () => {
  it('デモの相談文（要件 7.6）', () => {
    const c = cond(DEMO_CONSULT);
    expect(c.companion).toBe('友達と');
    expect(c.partySize).toBe(3);
    expect(c.stay).toBe('日帰り');
    expect(c.budgetYen).toBe(10000);
    expect(c.maxOneWayMin).toBeNull();
    expect(c.famous?.name).toBe('京都の竹林');
    expect(c.famous?.tags).toEqual(['竹', '静か', '散策']);
    // 有名地の語（竹林）は雰囲気に混ざらない
    expect(c.moods).toEqual(['静か']);
    expect(c.unknownFamous).toBeNull();
  });

  it.each([
    ['予算5千円で', 5000],
    ['予算5000円', 5000],
    ['1万くらい', 10000],
    ['1.5万で', 15000],
    ['予算は１万円', 10000],
    ['一万円で', 10000],
    ['3,000円以内', 3000],
  ])('予算: %s → %i', (text, yen) => {
    expect(cond(text).budgetYen).toBe(yen);
  });

  it.each([
    ['2時間以内で行ける所', 120],
    ['1時間半以内', 90],
    ['90分以内', 90],
    ['二時間以内', 120],
  ])('片道: %s → %i分', (text, min) => {
    expect(cond(text).maxOneWayMin).toBe(min);
  });

  it.each([
    ['友達2人で', '友達と', 2],
    ['家族3人で', '家族と', 3],
    ['ひとりで', 'ひとり', 1],
    ['恋人と', 'ふたり', null],
    ['2人で', 'ふたり', 2],
    ['一人で', 'ひとり', 1],
  ])('誰と: %s → %s', (text, companion, size) => {
    const c = cond(text);
    expect(c.companion).toBe(companion);
    expect(c.partySize).toBe(size);
  });

  it('「11人」を ひとり にしない', () => {
    const c = cond('11人で');
    expect(c.companion).toBeNull();
    expect(c.partySize).toBe(11);
  });

  it('泊まり・日帰り', () => {
    expect(cond('1泊で温泉').stay).toBe('泊まり');
    expect(cond('宿に泊まって温泉').stay).toBe('泊まり');
    expect(cond('日帰りで温泉').stay).toBe('日帰り');
  });

  it('雰囲気は語彙の辞書で判定し、語彙の順に並べる', () => {
    expect(cond('人が少ない海辺で海鮮').moods).toEqual(['静か', '海', '海鮮']);
    expect(cond('温泉と海鮮でのんびり').moods).toEqual(['静か', '海鮮', '温泉']);
  });

  it('「一緒に」「十分」が数字にならない', () => {
    const c = cond('一緒に十分楽しめる温泉');
    expect(c.partySize).toBeNull();
    expect(c.maxOneWayMin).toBeNull();
    expect(c.moods).toEqual(['温泉']);
  });

  it.each([
    ['富良野みたいなところ', '富良野'],
    ['友達と、ハワイっぽい海に行きたい', 'ハワイ'],
    ['北海道の花畑みたいな所', '北海道の花畑'],
  ])('辞書にない「〇〇みたいな」: %s → %s', (text, target) => {
    expect(extractSimileTarget(text)).toBe(target);
  });

  it('辞書にない有名地は有名地として扱わず、ほかの条件だけ残す', () => {
    const c = cond('友達と、ハワイっぽい海に行きたい');
    expect(c.famous).toBeNull();
    expect(c.unknownFamous).toBe('ハワイ');
    expect(c.companion).toBe('友達と');
    expect(c.moods).toEqual(['海']);
  });

  it('「〇〇っぽい」の〇〇が語彙の言葉なら、有名地ではなく雰囲気として読む', () => {
    const c = cond('海っぽい所に友達と');
    expect(c.unknownFamous).toBeNull();
    expect(c.moods).toEqual(['海']);
    expect(cond('竹林みたいな静かな所').moods).toEqual(['静か', '竹']);
  });

  it('辞書の有名地は別名でも当たる', () => {
    expect(cond('嵐山の竹林っぽい所').famous?.id).toBe('kyoto-bamboo');
    expect(cond('高千穂峡みたいな所').famous?.id).toBe('takachiho');
  });

  it('何も読めないと聞き返す', () => {
    expect(interpretSync('どこかいいところある？')).toEqual({ kind: 'clarify', question: CLARIFY_QUESTION });
  });

  it('辞書にない有名地だけのときは、1行を付けて聞き返す', () => {
    const r = interpretSync('富良野みたいなところ');
    expect(r.kind).toBe('clarify');
    expect(r.kind === 'clarify' && r.question).toContain('『富良野』はまだ対応していないので');
  });
});
