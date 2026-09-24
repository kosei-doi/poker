import { describe, expect, it } from 'vitest';
import prefecturesJson from '../data/prefectures.json';
import prefecturesRaw from '../data/prefectures.json?raw';
import { TOWNS } from '../data/towns';
import { fitZoom } from './geo';
import {
  JAPAN_FIT_PADDING,
  JAPAN_MIN_ZOOM,
  JAPAN_VIEW_BOUNDS,
  KENPOKU_LABEL_ANCHOR,
  KENPOKU_MIN_ZOOM,
  KENPOKU_PREF_CODE,
  KENPOKU_ZOOM_MS,
  MAX_ZOOM,
  prefectureAt,
  prefNoticeText,
  type Prefectures,
} from './japan';

const prefs = prefecturesJson as unknown as Prefectures;

const inView = ([lat, lng]: [number, number]) => {
  const [[s, w], [n, e]] = JAPAN_VIEW_BOUNDS;
  return lat >= s && lat <= n && lng >= w && lng <= e;
};

describe('都道府県境界（prefectures.json）', () => {
  it('47件で、コードが 01〜47 の重複なし', () => {
    expect(prefs.features).toHaveLength(47);
    const codes = prefs.features.map((f) => f.properties.code).sort();
    expect(codes).toEqual(Array.from({ length: 47 }, (_, i) => String(i + 1).padStart(2, '0')));
  });

  it('名前が入っていて、08 は茨城県', () => {
    for (const f of prefs.features) expect(f.properties.name).toMatch(/^.+[都道府県]$/);
    expect(prefs.features.find((f) => f.properties.code === KENPOKU_PREF_CODE)?.properties.name).toBe('茨城県');
  });

  it('ファイルが 200KB 以下', () => {
    expect(new TextEncoder().encode(prefecturesRaw).length).toBeLessThanOrEqual(200 * 1024);
  });

  it('県北6市町のラベル位置と、県北への線の端は茨城県の図形の中', () => {
    for (const t of TOWNS) expect(prefectureAt(prefs, t.labelPoint[0], t.labelPoint[1])?.code, t.name).toBe(KENPOKU_PREF_CODE);
    expect(prefectureAt(prefs, ...KENPOKU_LABEL_ANCHOR)?.code).toBe(KENPOKU_PREF_CODE);
  });

  it('代表的な地点が正しい都道府県に入る', () => {
    expect(prefectureAt(prefs, 35.681, 139.767)?.name).toBe('東京都'); // 東京駅
    expect(prefectureAt(prefs, 34.985, 135.759)?.name).toBe('京都府'); // 京都駅
    expect(prefectureAt(prefs, 43.069, 141.351)?.name).toBe('北海道'); // 札幌駅
    expect(prefectureAt(prefs, 26.212, 127.679)?.name).toBe('沖縄県'); // 那覇
    expect(prefectureAt(prefs, 36.559, 139.898)?.name).toBe('栃木県'); // 宇都宮駅
    expect(prefectureAt(prefs, 36.4, 140.5)?.name).toBe('茨城県'); // 水戸付近（県北の外）
    expect(prefectureAt(prefs, 36.5, 142.5)).toBeNull(); // 海の上
  });
});

describe('日本全体の範囲と定数', () => {
  it('JAPAN_VIEW_BOUNDS が本州・北海道・九州・沖縄本島を含む', () => {
    const points: [number, number][] = [
      [35.681, 139.767], // 東京
      [41.43, 140.1], // 本州の北端付近（竜飛崎）
      [45.52, 141.94], // 北海道の北端（宗谷岬）
      [43.38, 145.8], // 北海道の東端（納沙布岬）
      [31.0, 130.66], // 九州の南端（佐多岬）
      [33.21, 129.56], // 九州の西（平戸）
      [26.212, 127.679], // 沖縄本島（那覇）
      [26.87, 128.26], // 沖縄本島の北端（辺戸岬）
      [36.7, 140.6], // 茨城県北
    ];
    for (const p of points) expect(inView(p), String(p)).toBe(true);
  });

  it('ズームの時間は 1.5秒以内', () => {
    expect(KENPOKU_ZOOM_MS).toBeGreaterThan(0);
    expect(KENPOKU_ZOOM_MS).toBeLessThanOrEqual(1500);
  });

  it('JAPAN_MIN_ZOOM < KENPOKU_MIN_ZOOM < MAX_ZOOM', () => {
    expect(JAPAN_MIN_ZOOM).toBeLessThan(KENPOKU_MIN_ZOOM);
    expect(KENPOKU_MIN_ZOOM).toBeLessThan(MAX_ZOOM);
  });

  it.each([
    [375, 406],
    [860, 744],
  ])('%i×%ipx の地図で日本全体が収まるズームが JAPAN_MIN_ZOOM 以上（下限で押し戻されない）', (width, height) => {
    const [[s, w], [n, e]] = JAPAN_VIEW_BOUNDS;
    const zoom = fitZoom(
      [
        [s, w],
        [n, e],
      ],
      { width, height, padding: JAPAN_FIT_PADDING, pad: 0, maxZoom: MAX_ZOOM, zoomSnap: 0.25 },
    );
    expect(zoom).toBeGreaterThanOrEqual(JAPAN_MIN_ZOOM);
    expect(zoom).toBeLessThan(KENPOKU_MIN_ZOOM);
  });
});

describe('prefNoticeText', () => {
  it('N1-3 の文言', () => {
    expect(prefNoticeText('栃木県')).toBe('栃木県：この地域はまだ準備中です');
  });
});
