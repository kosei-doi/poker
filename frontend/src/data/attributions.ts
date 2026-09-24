/**
 * 境界データの出典（国土数値情報は CC BY 4.0。出典の表示が必要）。
 * 県北6市町（boundaries.json）と都道府県（prefectures.json）は同じ N03 なので、文言は1つで済む。
 * 地図の出典表示と「穴場度とは」のデータの出典の両方で使う
 */
export const BOUNDARY_ATTRIBUTION = '出典：「国土数値情報（行政区域データ）」（国土交通省）を加工して作成';

/** 国土数値情報 行政区域（N03）のデータセットのページ */
export const BOUNDARY_SOURCE_URL = 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2025.html';

/** 使ったデータの版と、何に使ったか（「穴場度とは」の一覧用） */
export const BOUNDARY_SOURCES = [
  { name: '市町村の境界（茨城県北の6市町）', dataset: '国土数値情報 行政区域（N03）2025年1月1日版 茨城県', file: 'boundaries.json' },
  { name: '都道府県の境界（日本全体の地図）', dataset: '国土数値情報 行政区域（N03）2025年1月1日版 全国', file: 'prefectures.json' },
] as const;

export const BOUNDARY_LICENSE = { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/deed.ja' } as const;
