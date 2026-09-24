import type { SpotId, TownId } from '../types';
import { townById } from './towns';
import { spotById } from './spots';
import credits from './photo-credits.json';

// 要件 N5。写真は src/assets/photos/ に同梱し、出典は photo-credits.json（scripts/fetch-photos.mjs が書き出す）

export type PhotoTarget = { kind: 'town'; id: TownId } | { kind: 'spot'; id: SpotId };

/** 使ってよいライセンス（13.11.1 の許可リスト） */
export const ALLOWED_LICENSES = [
  'CC0', 'Public domain', 'CC BY 2.0', 'CC BY 2.5', 'CC BY 3.0', 'CC BY 4.0', 'Unsplash License', 'Pexels License',
] as const;
export type PhotoLicense = (typeof ALLOWED_LICENSES)[number];

export interface PhotoCredit {
  /** 'spot-hitachiota-bamboo' のように kind-id */
  id: string;
  target: PhotoTarget;
  /** 'spot-hitachiota-bamboo.webp' */
  file: string;
  /** 変換後（≤ 1200） */
  width: number;
  height: number;
  /** 変換後（≤ 150KB） */
  bytes: number;
  /** 入手元での題名 */
  title: string;
  /** 撮影者（HTML を除いた文字列） */
  author: string;
  authorUrl: string | null;
  /** 入手元のページ（Commons のファイルページなど） */
  sourceUrl: string;
  license: PhotoLicense;
  licenseUrl: string;
  /** CC BY の「変更の表示」 */
  changes: string;
  /** 'YYYY-MM-DD' */
  retrievedAt: string;
}

export interface PhotoRef { src: string; alt: string; credit: PhotoCredit }

export const PHOTO_MAX_WIDTH = 1200;
/** 150KB（1000 バイト単位でも 1024 バイト単位でも超えないよう、小さいほうに合わせる） */
export const PHOTO_MAX_BYTES = 150_000;

/** 出典の一覧（町 → スポットの順。photo-credits.json の並び） */
export const PHOTO_CREDITS = credits as PhotoCredit[];

// ファイル名 → ビルド後の URL（ハッシュ付き）
const urls = import.meta.glob<string>('../assets/photos/*.webp', { eager: true, query: '?url', import: 'default' });
const urlOf = (file: string) => urls[`../assets/photos/${file}`] ?? null;

export const photoId = (target: PhotoTarget) => `${target.kind}-${target.id}`;

function find(target: PhotoTarget, name: string): PhotoRef | null {
  const credit = PHOTO_CREDITS.find((c) => c.id === photoId(target));
  const src = credit ? urlOf(credit.file) : null;
  if (!credit || !src) return null;
  return { src, alt: `${name}のイメージ写真`, credit };
}

export function getTownPhoto(townId: TownId): PhotoRef | null {
  const town = townById(townId);
  return town ? find({ kind: 'town', id: townId }, town.name) : null;
}

export function getSpotPhoto(spotId: SpotId): PhotoRef | null {
  const spot = spotById(spotId);
  return spot ? find({ kind: 'spot', id: spotId }, spot.name) : null;
}

/** 出典の一覧で使う、対象の表示名（例: '常陸太田市'・'常陸太田市 / 西山の竹林の小径'） */
export function photoTargetLabel(target: PhotoTarget): string {
  if (target.kind === 'town') return townById(target.id)?.name ?? target.id;
  const spot = spotById(target.id);
  if (!spot) return target.id;
  const town = townById(spot.townId);
  return town ? `${town.name} / ${spot.name}` : spot.name;
}
