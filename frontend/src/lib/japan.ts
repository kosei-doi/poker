import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import { pointInFeature } from './geo';

/** 都道府県境界（data/prefectures.json）の properties。code は '01'〜'47'、name は '茨城県' */
export interface PrefectureProps {
  code: string;
  name: string;
}
export type Prefectures = FeatureCollection<Polygon | MultiPolygon, PrefectureProps>;

/** 日本全体を表示するときの範囲（沖縄本島〜北海道）。小笠原などの離島は範囲外でよい */
export const JAPAN_VIEW_BOUNDS: [[number, number], [number, number]] = [
  [26.0, 127.5],
  [45.6, 146.0],
];
/** 日本全体のとき、ドラッグで動かせる範囲（JAPAN_VIEW_BOUNDS をこの割合だけ広げる） */
export const JAPAN_MAX_BOUNDS_PAD = 0.3;
/** 県北のとき、ドラッグで動かせる範囲（県北の範囲をこの割合だけ広げる。v1 の値） */
export const KENPOKU_MAX_BOUNDS_PAD = 0.6;
/** 日本全体 ⇄ 県北のズームの時間（N1-2 の「1.5秒以内」） */
export const KENPOKU_ZOOM_MS = 1200;
/**
 * 日本全体のときの minZoom。375×406px の地図で JAPAN_VIEW_BOUNDS が収まるズームは約 4.46、
 * PC（860×744）は約 5.37。小さいほうより下にする
 */
export const JAPAN_MIN_ZOOM = 4;
/** 県北のときの minZoom（v1 の値） */
export const KENPOKU_MIN_ZOOM = 8;
/** どちらの表示でも同じ（v1 の値） */
export const MAX_ZOOM = 15;
/** 日本全体を fitBounds するときの余白（px） */
export const JAPAN_FIT_PADDING = 12;
/** 茨城県の都道府県コード */
export const KENPOKU_PREF_CODE = '08';
/** 「対応エリア: 茨城県北」のラベルを置く位置（県北の東の海上）[lat, lng]。スマホ幅の日本全体でも県北との線が見える長さにする */
export const KENPOKU_LABEL_POINT: [number, number] = [36.7, 141.5];
/** ラベルと県北をつなぐ線の、県北側の端（県北の海岸の少し内側）[lat, lng] */
export const KENPOKU_LABEL_ANCHOR: [number, number] = [36.72, 140.72];

/** 都道府県の名前を、準備中の表示（N1-3）の文言にする */
export function prefNoticeText(name: string): string {
  return `${name}：この地域はまだ準備中です`;
}

/** 点（lat, lng）を含む都道府県（見つからなければ null） */
export function prefectureAt(prefs: Prefectures, lat: number, lng: number): PrefectureProps | null {
  const hit = prefs.features.find((f) => pointInFeature(lat, lng, f));
  return hit ? hit.properties : null;
}
