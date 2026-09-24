import { describe, expect, it } from 'vitest';
import { SPOTS } from '../data/spots';
import { TOWNS } from '../data/towns';
import {
  EMPTY_DRAFT,
  PARTNER_TOWN_IDS,
  POSTED_ID_PREFIX,
  allSpots,
  findSpot,
  isInsideTown,
  isPosted,
  isValidPostedSpot,
  photoCandidates,
  validatePost,
  type PostDraft,
  type PostedSpot,
} from './partner';

const INSIDE: { lat: number; lng: number } = { lat: 36.535, lng: 140.515 };
const OUTSIDE: { lat: number; lng: number } = { lat: 36.9, lng: 140.9 };

const valid: PostDraft = {
  name: '里山の朝市',
  kind: '食べる',
  description: '地元の野菜とおにぎりが並ぶ小さな朝市',
  stayMin: '30',
  costYen: '500',
  location: INSIDE,
  photoSpotId: 'hitachiota-soba',
};

function posted(over: Partial<PostedSpot> = {}): PostedSpot {
  return {
    id: `${POSTED_ID_PREFIX}abc-123`,
    posted: true,
    townId: 'hitachiota',
    name: '里山の朝市',
    kind: '食べる',
    description: '説明',
    lat: INSIDE.lat,
    lng: INSIDE.lng,
    order: 0,
    stayMin: 30,
    moveMin: 0,
    costYen: 500,
    photoSpotId: 'hitachiota-soba',
    createdAt: '2026-09-24T10:00:00.000Z',
    ...over,
  };
}

const errorsOf = (draft: PostDraft, p: PostedSpot[] = []) => {
  const r = validatePost(draft, 'hitachiota', p);
  return r.ok ? {} : r.errors;
};

describe('validatePost', () => {
  it('正しい入力なら投稿の値を返す', () => {
    const r = validatePost({ ...valid, name: '  里山の朝市  ' }, 'hitachiota', []);
    expect(r).toEqual({
      ok: true,
      spot: {
        posted: true,
        townId: 'hitachiota',
        name: '里山の朝市',
        kind: '食べる',
        description: '地元の野菜とおにぎりが並ぶ小さな朝市',
        lat: INSIDE.lat,
        lng: INSIDE.lng,
        order: 0,
        stayMin: 30,
        moveMin: 0,
        costYen: 500,
        photoSpotId: 'hitachiota-soba',
      },
    });
  });

  it('空のフォームはすべての項目が誤り', () => {
    expect(Object.keys(errorsOf(EMPTY_DRAFT)).sort()).toEqual(
      ['costYen', 'description', 'kind', 'location', 'name', 'photo', 'stayMin'].sort(),
    );
  });

  it('空白だけの名前・説明は空とみなす', () => {
    const e = errorsOf({ ...valid, name: '   ', description: '\n ' });
    expect(e.name).toBe('名前を入れてください');
    expect(e.description).toBe('説明を入れてください');
  });

  it('名前は30字まで', () => {
    expect(errorsOf({ ...valid, name: 'あ'.repeat(30) }).name).toBeUndefined();
    expect(errorsOf({ ...valid, name: 'あ'.repeat(31) }).name).toBe('名前は30字以内にしてください');
  });

  it('説明は120字まで', () => {
    expect(errorsOf({ ...valid, description: 'あ'.repeat(120) }).description).toBeUndefined();
    expect(errorsOf({ ...valid, description: 'あ'.repeat(121) }).description).toBe('説明は120字以内にしてください');
  });

  it('同じ町の既存スポット・投稿と同名は不可。ほかの町なら可', () => {
    expect(errorsOf({ ...valid, name: '西山の竹林の小径' }).name).toBe('この町に同じ名前のスポットがあります');
    expect(errorsOf(valid, [posted()]).name).toBe('この町に同じ名前のスポットがあります');
    expect(errorsOf(valid, [posted({ townId: 'hitachi' })]).name).toBeUndefined();
  });

  it('滞在時間は10〜600の整数', () => {
    expect(errorsOf({ ...valid, stayMin: '' }).stayMin).toBe('滞在時間を入れてください');
    expect(errorsOf({ ...valid, stayMin: '9' }).stayMin).toMatch(/10〜600分/);
    expect(errorsOf({ ...valid, stayMin: '601' }).stayMin).toMatch(/10〜600分/);
    expect(errorsOf({ ...valid, stayMin: '30.5' }).stayMin).toMatch(/10〜600分/);
    expect(errorsOf({ ...valid, stayMin: '-30' }).stayMin).toMatch(/10〜600分/);
    expect(errorsOf({ ...valid, stayMin: '10' }).stayMin).toBeUndefined();
    expect(errorsOf({ ...valid, stayMin: '600' }).stayMin).toBeUndefined();
  });

  it('費用の目安は0〜100000の整数（0は無料）', () => {
    expect(errorsOf({ ...valid, costYen: '' }).costYen).toBe('費用の目安を入れてください（無料なら 0）');
    expect(errorsOf({ ...valid, costYen: '0' }).costYen).toBeUndefined();
    expect(errorsOf({ ...valid, costYen: '100000' }).costYen).toBeUndefined();
    expect(errorsOf({ ...valid, costYen: '100001' }).costYen).toMatch(/0〜100,000円/);
    expect(errorsOf({ ...valid, costYen: 'abc' }).costYen).toMatch(/0〜100,000円/);
  });

  it('全角数字も受け付ける', () => {
    const r = validatePost({ ...valid, stayMin: '４５', costYen: '１２００' }, 'hitachiota', []);
    expect(r.ok && [r.spot.stayMin, r.spot.costYen]).toEqual([45, 1200]);
  });

  it('場所は必須で、町の境界の内側だけ', () => {
    expect(errorsOf({ ...valid, location: null }).location).toBe('地図を押して場所を選んでください');
    expect(errorsOf({ ...valid, location: OUTSIDE }).location).toBe('町の境界の外は選べません');
    // ほかの町の中の点も外とみなす
    expect(validatePost(valid, 'kitaibaraki', []).ok).toBe(false);
  });

  it('種類は必須', () => {
    expect(errorsOf({ ...valid, kind: null }).kind).toBe('種類を選んでください');
  });

  it('写真は必須で、種類に合うものだけ', () => {
    expect(errorsOf({ ...valid, photoSpotId: null }).photo).toBe('写真を選んでください');
    expect(errorsOf({ ...valid, photoSpotId: 'hitachiota-bamboo' }).photo).toBe('種類に合う写真を選び直してください');
    expect(errorsOf({ ...valid, photoSpotId: 'no-such-spot' }).photo).toBe('種類に合う写真を選び直してください');
    expect(errorsOf({ ...valid, kind: null }).photo).toBe('種類に合う写真を選び直してください');
  });
});

describe('allSpots・findSpot・isPosted', () => {
  it('投稿が無ければ既存スポットそのもの', () => {
    expect(allSpots([])).toBe(SPOTS);
  });

  it('投稿を後ろに足す', () => {
    const p = posted();
    const all = allSpots([p]);
    expect(all).toHaveLength(SPOTS.length + 1);
    expect(all.at(-1)).toBe(p);
  });

  it('既存スポットと投稿のどちらも id で探せる', () => {
    const p = posted();
    expect(findSpot('hitachiota-bamboo', [p])?.name).toBe('西山の竹林の小径');
    expect(findSpot(p.id, [p])).toBe(p);
    expect(findSpot('no-such', [p])).toBeUndefined();
  });

  it('投稿かどうかを見分ける', () => {
    expect(isPosted(posted())).toBe(true);
    expect(isPosted(SPOTS[0])).toBe(false);
  });
});

describe('photoCandidates', () => {
  it('同じ種類の既存スポットだけを返す', () => {
    for (const kind of ['食べる', '見る', '体験'] as const) {
      const c = photoCandidates(kind);
      expect(c.length).toBeGreaterThan(0);
      expect(c.every((s) => s.kind === kind)).toBe(true);
      expect(c).toHaveLength(SPOTS.filter((s) => s.kind === kind).length);
    }
  });
});

describe('isInsideTown', () => {
  it('常陸太田市の内側と外側', () => {
    expect(isInsideTown('hitachiota', INSIDE.lat, INSIDE.lng)).toBe(true);
    expect(isInsideTown('hitachiota', OUTSIDE.lat, OUTSIDE.lng)).toBe(false);
  });

  it('未知の町は常に外', () => {
    expect(isInsideTown('no-such-town', INSIDE.lat, INSIDE.lng)).toBe(false);
  });

  it('投稿できる各町の中心の目安は、その町の内側', () => {
    for (const id of PARTNER_TOWN_IDS) {
      const t = TOWNS.find((x) => x.id === id)!;
      expect(isInsideTown(id, t.labelPoint[0], t.labelPoint[1])).toBe(true);
    }
  });
});

describe('PARTNER_TOWN_IDS', () => {
  it('スポットを持つ5町で、常陸大宮市は含まない', () => {
    expect(PARTNER_TOWN_IDS).toHaveLength(5);
    expect(PARTNER_TOWN_IDS).not.toContain('hitachiomiya');
  });
});

describe('isValidPostedSpot', () => {
  it('正しい投稿は通る', () => {
    expect(isValidPostedSpot(posted())).toBe(true);
  });

  it.each([
    ['null', null],
    ['文字列', 'x'],
    ['posted が無い', { ...posted(), posted: undefined }],
    ['id の接頭辞が違う', posted({ id: 'hitachiota-x' })],
    ['未知の町', posted({ townId: 'hitachiomiya' })],
    ['名前が空', posted({ name: '  ' })],
    ['未知の種類', { ...posted(), kind: '泊まる' }],
    ['境界の外', posted({ lat: OUTSIDE.lat, lng: OUTSIDE.lng })],
    ['写真の種類違い', posted({ photoSpotId: 'hitachiota-bamboo' })],
    ['日時が不正', posted({ createdAt: 'yesterday' })],
    ['滞在時間が文字列', { ...posted(), stayMin: '30' }],
  ])('%s は捨てる', (_label, v) => {
    expect(isValidPostedSpot(v)).toBe(false);
  });
});
