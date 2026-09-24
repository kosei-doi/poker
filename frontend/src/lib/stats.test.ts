import { describe, expect, it } from 'vitest';
import { voice, town, spot } from '../test/fixtures';
import {
  computeAllStats, diffVoiceChange, holeLabel, isReference, matchRate, meanSatisfaction, passesQuality, round1, spotStats,
  townStats,
} from './stats';

describe('meanSatisfaction', () => {
  it('単純平均', () => {
    expect(meanSatisfaction([voice('a', 5), voice('a', 3), voice('b', 4)])).toBe(4);
  });
  it('声0件なら 3', () => {
    expect(meanSatisfaction([])).toBe(3);
  });
});

describe('spotStats', () => {
  it('要件5章の式どおり（ベイズ補正・知名度・穴場度）', () => {
    const vs = [voice('s', 5, 'unknown'), voice('s', 4, 'unknown'), voice('s', 4, 'known'), voice('s', 3, 'unsure')];
    const s = spotStats('s', vs, 4);
    // (5×4 + 16) / (5 + 4) = 4
    expect(s.satisfaction).toBeCloseTo(4, 10);
    // 不明は数えない: (1 + 1) / (3 + 2) = 0.4
    expect(s.knownRatio).toBeCloseTo(0.4, 10);
    expect(s.fame).toBeCloseTo(2, 10);
    expect(s.hole).toBeCloseTo(2, 10);
    expect(s.count).toBe(4);
  });
  it('声0件は全体平均と知名度2.5', () => {
    const s = spotStats('s', [], 4.2);
    expect(s.satisfaction).toBeCloseTo(4.2, 10);
    expect(s.fame).toBeCloseTo(2.5, 10);
    expect(s.count).toBe(0);
  });
  it('知名度は0〜5に収まる', () => {
    const allKnown = spotStats('s', Array.from({ length: 50 }, () => voice('s', 4, 'known')), 4);
    const allUnknown = spotStats('s', Array.from({ length: 50 }, () => voice('s', 4, 'unknown')), 4);
    expect(allKnown.fame).toBeLessThanOrEqual(5);
    expect(allUnknown.fame).toBeGreaterThanOrEqual(0);
  });
});

describe('townStats', () => {
  it('スポットの件数で重み付けした平均', () => {
    const a = { spotId: 'a', count: 3, satisfaction: 4, knownRatio: 0, fame: 1, hole: 3 };
    const b = { spotId: 'b', count: 1, satisfaction: 2, knownRatio: 0, fame: 3, hole: -1 };
    const c = { spotId: 'c', count: 0, satisfaction: 5, knownRatio: 0, fame: 0, hole: 5 };
    const t = townStats('t', [a, b, c])!;
    expect(t.count).toBe(4);
    expect(t.satisfaction).toBeCloseTo(3.5, 10);
    expect(t.fame).toBeCloseTo(1.5, 10);
    expect(t.hole).toBeCloseTo(2, 10);
  });
  it('合計0件なら null', () => {
    expect(townStats('t', [])).toBeNull();
  });
});

describe('computeAllStats', () => {
  it('町とスポットの索引を作り、声のない町は null', () => {
    const towns = [town('t1'), town('t2')];
    const spots = [spot('s1', 't1'), spot('s2', 't2')];
    const idx = computeAllStats(towns, spots, [voice('s1', 5, 'unknown'), voice('s1', 3)]);
    expect(idx.mean).toBe(4);
    expect(idx.spots.s1.count).toBe(2);
    expect(idx.spots.s2.count).toBe(0);
    expect(idx.towns.t1?.count).toBe(2);
    expect(idx.towns.t2).toBeNull();
  });
});

describe('穴場ラベル・参考値・候補の判定', () => {
  it('丸めた値で判定する', () => {
    expect(holeLabel(2.95)).toBe('ど穴場');
    expect(holeLabel(3)).toBe('ど穴場');
    expect(holeLabel(2.94)).toBe('穴場');
    expect(holeLabel(2)).toBe('穴場');
    expect(holeLabel(1)).toBe('やや穴場');
    expect(holeLabel(0.96)).toBe('やや穴場');
    expect(holeLabel(0.94)).toBeNull();
  });
  it('5件未満は参考値', () => {
    expect(isReference(4)).toBe(true);
    expect(isReference(5)).toBe(false);
  });
  it('満足度3.5・穴場度1を丸めた値で判定', () => {
    const base = { townId: 't', count: 5, fame: 1 };
    expect(passesQuality({ ...base, satisfaction: 3.45, hole: 0.95 })).toEqual({ satisfaction: true, hole: true });
    expect(passesQuality({ ...base, satisfaction: 3.44, hole: 0.94 })).toEqual({ satisfaction: false, hole: false });
  });
  it('round1', () => {
    expect(round1(1.95)).toBe(2);
    expect(round1(2.26)).toBe(2.3);
  });
});

describe('matchRate', () => {
  it('有名地のタグのうち町のタグに含まれる割合', () => {
    expect(matchRate(['竹', '静か', '散策'], ['竹', '静か', '海'])).toBeCloseTo(2 / 3, 10);
    expect(matchRate(['竹'], ['海'])).toBe(0);
    expect(matchRate(['竹', '静か'], ['静か', '竹'])).toBe(1);
  });
});

describe('diffVoiceChange', () => {
  it('前後の値とタグの変化を返す（変化0でも返す、新しいタグは isNew）', () => {
    const towns = [town('t')];
    const spots = [spot('s', 't'), spot('s2', 't')];
    const before = computeAllStats(towns, spots, [voice('s', 4, 'known'), voice('s2', 4)]);
    const after = computeAllStats(towns, spots, [voice('s', 4, 'known'), voice('s2', 4), voice('s', 5, 'unknown')]);
    const change = diffVoiceChange(
      before, after,
      { townId: 't', catchphrase: '竹の町', tags: [{ tag: '竹', count: 2 }] },
      { townId: 't', catchphrase: '竹と静けさの町', tags: [{ tag: '竹', count: 3 }, { tag: '静か', count: 1 }] },
      's', 't',
    );
    expect(change.spot.count).toEqual([1, 2]);
    expect(change.town.count).toEqual([2, 3]);
    expect(change.spot.hole[1]).toBeGreaterThan(change.spot.hole[0]);
    expect(change.tags).toEqual([
      { tag: '竹', before: 2, after: 3, isNew: false },
      { tag: '静か', before: 0, after: 1, isNew: true },
    ]);
    expect(change.catchphrase).toEqual(['竹の町', '竹と静けさの町']);
  });
});
