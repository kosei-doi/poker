import boundariesJson from '../data/boundaries.json';
import { SPOTS } from '../data/spots';
import { TOWNS } from '../data/towns';
import type { Spot, SpotId, SpotKind, TownId } from '../types';
import { pointInFeature, type Boundaries } from './geo';

const boundaries = boundariesJson as unknown as Boundaries;

/** 町が投稿したスポット（N6-2・N6-3）。写真は同じ種類の既存スポットの写真を借りる */
export interface PostedSpot extends Spot {
  posted: true;
  photoSpotId: SpotId;
  createdAt: string;
}

export const POSTED_ID_PREFIX = 'posted-';
export const SPOT_KINDS: SpotKind[] = ['食べる', '見る', '体験'];

/** 投稿できる町（声とスポットのデータを持つ5町。N6-1） */
export const PARTNER_TOWN_IDS: TownId[] = TOWNS.filter((t) => SPOTS.some((s) => s.townId === t.id)).map((t) => t.id);

export function isPosted(spot: Spot): spot is PostedSpot {
  return (spot as Partial<PostedSpot>).posted === true;
}

/** 既存のスポット＋投稿したスポット（点数・声・町の詳細の一覧に使う。1日プランには使わない） */
export function allSpots(posted: PostedSpot[]): Spot[] {
  return posted.length === 0 ? SPOTS : [...SPOTS, ...posted];
}

export function findSpot(id: SpotId, posted: PostedSpot[]): Spot | undefined {
  return SPOTS.find((s) => s.id === id) ?? posted.find((s) => s.id === id);
}

/** 写真を借りられる既存スポット（同じ種類。N6-2） */
export function photoCandidates(kind: SpotKind): Spot[] {
  return SPOTS.filter((s) => s.kind === kind);
}

export function isInsideTown(townId: TownId, lat: number, lng: number): boolean {
  const town = TOWNS.find((t) => t.id === townId);
  const f = town && boundaries.features.find((x) => x.properties.code === town.code);
  return !!f && pointInFeature(lat, lng, f);
}

export type PostField = 'name' | 'kind' | 'description' | 'stayMin' | 'costYen' | 'location' | 'photo';

export const POST_FIELD_LABEL: Record<PostField, string> = {
  name: '名前',
  kind: '種類',
  description: '説明',
  stayMin: '滞在時間',
  costYen: '費用の目安',
  location: '場所',
  photo: '写真',
};

export interface PostDraft {
  name: string;
  kind: SpotKind | null;
  description: string;
  stayMin: string;
  costYen: string;
  location: { lat: number; lng: number } | null;
  photoSpotId: SpotId | null;
}

export const EMPTY_DRAFT: PostDraft = {
  name: '', kind: null, description: '', stayMin: '', costYen: '', location: null, photoSpotId: null,
};

export const LIMITS = { nameMax: 30, descriptionMax: 120, stayMin: 10, stayMax: 600, costMax: 100000 } as const;

function parseIntStrict(v: string): number | null {
  const t = v.trim().replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  return /^\d+$/.test(t) ? Number(t) : null;
}

export type PostResult =
  | { ok: true; spot: Omit<PostedSpot, 'id' | 'createdAt'> }
  | { ok: false; errors: Partial<Record<PostField, string>> };

/** 投稿の検証（N6-2）。足りない・誤っている項目ごとに理由を返す */
export function validatePost(draft: PostDraft, townId: TownId, posted: PostedSpot[]): PostResult {
  const errors: Partial<Record<PostField, string>> = {};
  const name = draft.name.trim();
  const description = draft.description.trim();

  if (!name) errors.name = '名前を入れてください';
  else if ([...name].length > LIMITS.nameMax) errors.name = `名前は${LIMITS.nameMax}字以内にしてください`;
  else if (allSpots(posted).some((s) => s.townId === townId && s.name === name)) {
    errors.name = 'この町に同じ名前のスポットがあります';
  }

  if (!draft.kind) errors.kind = '種類を選んでください';

  if (!description) errors.description = '説明を入れてください';
  else if ([...description].length > LIMITS.descriptionMax) {
    errors.description = `説明は${LIMITS.descriptionMax}字以内にしてください`;
  }

  const stay = parseIntStrict(draft.stayMin);
  if (!draft.stayMin.trim()) errors.stayMin = '滞在時間を入れてください';
  else if (stay === null || stay < LIMITS.stayMin || stay > LIMITS.stayMax) {
    errors.stayMin = `滞在時間は${LIMITS.stayMin}〜${LIMITS.stayMax}分の整数で入れてください`;
  }

  const cost = parseIntStrict(draft.costYen);
  if (!draft.costYen.trim()) errors.costYen = '費用の目安を入れてください（無料なら 0）';
  else if (cost === null || cost > LIMITS.costMax) {
    errors.costYen = `費用の目安は0〜${LIMITS.costMax.toLocaleString('ja-JP')}円の整数で入れてください`;
  }

  if (!draft.location) errors.location = '地図を押して場所を選んでください';
  else if (!isInsideTown(townId, draft.location.lat, draft.location.lng)) errors.location = '町の境界の外は選べません';

  if (!draft.photoSpotId) errors.photo = '写真を選んでください';
  else if (!draft.kind || !photoCandidates(draft.kind).some((s) => s.id === draft.photoSpotId)) {
    errors.photo = '種類に合う写真を選び直してください';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    spot: {
      posted: true,
      townId,
      name,
      kind: draft.kind!,
      description,
      lat: draft.location!.lat,
      lng: draft.location!.lng,
      order: 0,
      stayMin: stay!,
      moveMin: 0,
      costYen: cost!,
      photoSpotId: draft.photoSpotId!,
    },
  };
}

/** 読み込んだ値が正しい投稿か（storage 用） */
export function isValidPostedSpot(v: unknown): v is PostedSpot {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    o.posted === true &&
    typeof o.id === 'string' &&
    o.id.startsWith(POSTED_ID_PREFIX) &&
    typeof o.townId === 'string' &&
    PARTNER_TOWN_IDS.includes(o.townId) &&
    typeof o.name === 'string' &&
    o.name.trim().length > 0 &&
    typeof o.kind === 'string' &&
    (SPOT_KINDS as string[]).includes(o.kind) &&
    typeof o.description === 'string' &&
    typeof o.lat === 'number' &&
    typeof o.lng === 'number' &&
    isInsideTown(o.townId, o.lat, o.lng) &&
    typeof o.stayMin === 'number' &&
    typeof o.costYen === 'number' &&
    typeof o.photoSpotId === 'string' &&
    photoCandidates(o.kind as SpotKind).some((s) => s.id === o.photoSpotId) &&
    typeof o.createdAt === 'string' &&
    !Number.isNaN(Date.parse(o.createdAt))
  );
}
