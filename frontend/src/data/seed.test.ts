import { describe, expect, it } from 'vitest';
import { analyzeVoiceSync } from '../ai/mock/analyzeVoice';
import { interpretSync } from '../ai/mock/interpret';
import { recommendSync } from '../ai/mock/recommend';
import { buildCandidateView } from '../lib/candidate';
import { fitZoom, MIN_PIN_GAP_PX, pixelDistance, pointInFeature, SPOT_FIT, type Boundaries } from '../lib/geo';
import { round1, passesQuality } from '../lib/stats';
import { TAGS, type Voice } from '../types';
import boundariesJson from './boundaries.json';
import { DEMO_CONSULT, DEMO_SPOT_ID, DEMO_VOICE, EXAMPLES } from './examples';
import { FAMOUS_PLACES } from './famous';
import { buildSnapshot } from './seed';
import { SPOTS } from './spots';
import { TOWNS } from './towns';
import { SEED_VOICES } from './voices';

const boundaries = boundariesJson as unknown as Boundaries;
const snap = buildSnapshot(SEED_VOICES);
const tagSet = new Set<string>(TAGS);

function demoConditions() {
  const r = interpretSync(DEMO_CONSULT);
  if (r.kind !== 'conditions') throw new Error('clarify');
  return r.conditions;
}

function withDemoVoice(): Voice[] {
  const a = analyzeVoiceSync(DEMO_VOICE);
  return [
    ...SEED_VOICES,
    {
      id: 'demo', spotId: DEMO_SPOT_ID, text: DEMO_VOICE, satisfaction: a.satisfaction, known: a.known, tags: a.tags,
      evidence: a.evidence, createdAt: '2026-09-24T12:00:00.000Z', source: 'user',
    },
  ];
}

describe('デモの制約（要件 7.6）', () => {
  it('デモの相談文で、声のある5町のうち2町が理由付きで外れ、ちょうど3町が残る', () => {
    const r = recommendSync(demoConditions(), snap);
    expect(r.eliminated).toEqual([
      { townId: 'daigo', rule: 'dayTrip', reason: '日帰りには遠い（片道170分）' },
      { townId: 'kitaibaraki', rule: 'budget', reason: '予算を超える（約11,400円）' },
    ]);
    expect(r.candidateIds).toEqual(['hitachiota', 'takahagi', 'hitachi']);
  });

  it('残った3町は根拠の声が2件以上、D4-2 の裏付けの声がある', () => {
    const c = demoConditions();
    for (const id of ['hitachiota', 'takahagi', 'hitachi']) {
      const v = buildCandidateView(id, c, snap)!;
      expect(v.quotes.length).toBeGreaterThanOrEqual(2);
      expect(v.famousEvidence).not.toBeNull();
      expect(v.reasonText).not.toBeNull();
    }
  });

  it('デモの感想文で、デモスポットの穴場度（丸め後）が 0.2 以上上がる', () => {
    const before = snap.stats.spots[DEMO_SPOT_ID];
    const afterSnap = buildSnapshot(withDemoVoice());
    const after = afterSnap.stats.spots[DEMO_SPOT_ID];
    expect(before.count).toBe(5);
    expect(after.count).toBe(6);
    expect(round1(after.hole) - round1(before.hole)).toBeGreaterThanOrEqual(0.2 - 1e-9);
    // 町のタグの件数が増える（D2-5）
    const tb = snap.summaries.hitachiota.tags;
    const ta = afterSnap.summaries.hitachiota.tags;
    expect(ta.find((t) => t.tag === '竹')!.count).toBe(tb.find((t) => t.tag === '竹')!.count + 1);
    expect(ta.find((t) => t.tag === '静か')!.count).toBe(tb.find((t) => t.tag === '静か')!.count + 1);
    // 確定した声が提案カードの先頭の引用になる
    expect(buildCandidateView('hitachiota', demoConditions(), afterSnap)!.quotes[0].id).toBe('demo');
  });

  it('デモスポット以外の声は各5〜20件', () => {
    for (const s of SPOTS) {
      const n = SEED_VOICES.filter((v) => v.spotId === s.id).length;
      if (s.id === DEMO_SPOT_ID) expect(n).toBe(5);
      else {
        expect(n, s.id).toBeGreaterThanOrEqual(5);
        expect(n, s.id).toBeLessThanOrEqual(20);
      }
    }
  });

  it('声のない町がちょうど1つ', () => {
    const empty = TOWNS.filter((t) => snap.stats.towns[t.id] === null).map((t) => t.id);
    expect(empty).toEqual(['hitachiomiya']);
  });

  it('全体の平均満足度は 4.0〜4.2', () => {
    expect(snap.stats.mean).toBeGreaterThanOrEqual(4.0);
    expect(snap.stats.mean).toBeLessThanOrEqual(4.2);
  });

  it('例文2は北茨城市だけ、例文3は高萩市だけが残る', () => {
    const run = (text: string) => {
      const r = interpretSync(text);
      if (r.kind !== 'conditions') throw new Error('clarify');
      return recommendSync(r.conditions, snap).candidateIds;
    };
    expect(run(EXAMPLES[1].text)).toEqual(['kitaibaraki']);
    expect(run(EXAMPLES[2].text)).toEqual(['takahagi']);
  });
});

describe('データの整合', () => {
  it('初期の声は analyzeVoice の読み取り結果と一致する', () => {
    for (const v of SEED_VOICES) {
      const a = analyzeVoiceSync(v.text);
      expect({ id: v.id, satisfaction: v.satisfaction, known: v.known, tags: v.tags, evidence: v.evidence }).toEqual({
        id: v.id, satisfaction: a.satisfaction, known: a.known, tags: a.tags, evidence: a.evidence,
      });
    }
  });

  it('初期の声の投稿日時は発表日より前（2026-04-01〜2026-09-20）', () => {
    for (const v of SEED_VOICES) {
      const t = Date.parse(v.createdAt);
      expect(t).toBeGreaterThanOrEqual(Date.parse('2026-04-01T00:00:00Z'));
      expect(t).toBeLessThan(Date.parse('2026-09-21T00:00:00Z'));
    }
  });

  it('声の id は重複しない', () => {
    expect(new Set(SEED_VOICES.map((v) => v.id)).size).toBe(SEED_VOICES.length);
  });

  it('タグと有名地のタグはすべて20語の中。有名地は10件で各2〜4タグ', () => {
    for (const v of SEED_VOICES) v.tags.forEach((t) => expect(tagSet.has(t)).toBe(true));
    expect(FAMOUS_PLACES).toHaveLength(10);
    for (const f of FAMOUS_PLACES) {
      expect(f.tags.length).toBeGreaterThanOrEqual(2);
      expect(f.tags.length).toBeLessThanOrEqual(4);
      f.tags.forEach((t) => expect(tagSet.has(t)).toBe(true));
    }
  });

  it('町の一言は15字以内、タグは3〜5個', () => {
    for (const s of Object.values(snap.summaries)) {
      expect([...s.catchphrase].length).toBeLessThanOrEqual(15);
      expect(s.tags.length).toBeGreaterThanOrEqual(3);
      expect(s.tags.length).toBeLessThanOrEqual(5);
    }
  });

  it('声のある町はすべて満足度3.5以上・穴場度1以上（候補になれる）', () => {
    for (const t of TOWNS) {
      const s = snap.stats.towns[t.id];
      if (!s) continue;
      expect(passesQuality(s), t.id).toEqual({ satisfaction: true, hole: true });
    }
  });

  it('スポットの座標は町の境界の内側', () => {
    for (const s of SPOTS) {
      const town = TOWNS.find((t) => t.id === s.townId)!;
      const f = boundaries.features.find((x) => x.properties.code === town.code)!;
      expect(pointInFeature(s.lat, s.lng, f), s.id).toBe(true);
    }
  });

  it.each([
    ['スマホ（375px・地図 50vh）', 375, 406],
    ['PC（1280×800 の地図部分）', 860, 744],
  ])('町を選んだときのズームで、スポットの番号ピン同士が %s でも重ならない（D1-4）', (_, width, height) => {
    for (const t of TOWNS) {
      const pts = SPOTS.filter((s) => s.townId === t.id).map((s) => [s.lat, s.lng] as [number, number]);
      if (pts.length < 2) continue;
      const zoom = fitZoom(pts, { width, height, ...SPOT_FIT });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          expect(pixelDistance(pts[i], pts[j], zoom), `${t.id} ${i + 1}-${j + 1}`).toBeGreaterThanOrEqual(MIN_PIN_GAP_PX);
        }
      }
    }
  });

  it('ラベル位置は町の境界の内側', () => {
    for (const t of TOWNS) {
      const f = boundaries.features.find((x) => x.properties.code === t.code)!;
      expect(pointInFeature(t.labelPoint[0], t.labelPoint[1], f), t.id).toBe(true);
    }
  });

  it('boundaries.json のコードと towns が一致する', () => {
    expect(boundaries.features.map((f) => f.properties.code).sort()).toEqual(TOWNS.map((t) => t.code).sort());
  });

  it('スポットの order は町ごとに 1 から連番、最後の移動時間は 0', () => {
    for (const t of TOWNS) {
      const ss = SPOTS.filter((s) => s.townId === t.id).sort((a, b) => a.order - b.order);
      ss.forEach((s, i) => expect(s.order).toBe(i + 1));
      if (ss.length > 0) expect(ss.at(-1)!.moveMin).toBe(0);
    }
  });
});
