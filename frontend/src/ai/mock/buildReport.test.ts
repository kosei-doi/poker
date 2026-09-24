import { describe, expect, it } from 'vitest';
import { town, voice } from '../../test/fixtures';
import { buildPitch, buildReportSync } from './buildReport';

const t = town('t', { name: '常陸太田市' });

describe('buildReport', () => {
  it('良い点は「知らなかった」かつ満足度4以上の声のタグの上位3', () => {
    const r = buildReportSync(t, [
      voice('s', 5, 'unknown', ['竹', '静か']),
      voice('s', 4, 'unknown', ['竹', '散策']),
      voice('s', 4, 'unknown', ['竹', '静か', '歴史']),
      voice('s', 5, 'known', ['海', '海']),
      voice('s', 3, 'unknown', ['滝']),
    ]);
    expect(r.goodPoints).toEqual([
      { tag: '竹', count: 3 },
      { tag: '静か', count: 2 },
      { tag: '散策', count: 1 },
    ]);
    expect(r.pitch).toBe('知らずに訪れた人が『竹』と『静けさ』に満足した町、常陸太田市。');
  });

  it('不満は満足度2以下の声から辞書の言葉を数える（表記ゆれはまとめる）', () => {
    const r = buildReportSync(t, [
      voice('s', 2, 'unsure', [], { text: '駐車場が狭くて、道が分かりにくい。残念' }),
      voice('s', 1, 'unsure', [], { text: '駐車場がない。わかりにくい' }),
      voice('s', 2, 'unsure', [], { text: '混んでいた。微妙' }),
      voice('s', 4, 'unsure', [], { text: '駐車場は狭いけど良かった' }),
    ]);
    expect(r.complaints).toEqual([
      { word: '駐車場', count: 2 },
      { word: '分かりにくい', count: 2 },
      { word: '混んでいる', count: 1 },
    ]);
  });

  it('不満がないときは空配列（画面で「目立った不満はなし」）', () => {
    const r = buildReportSync(t, [voice('s', 5, 'unknown', ['竹']), voice('s', 3, 'unsure', [], { text: '駐車場が狭い' })]);
    expect(r.complaints).toEqual([]);
  });

  it('発信文: 良い点2・1・0件', () => {
    expect(buildPitch('A町', { goodPoints: [{ tag: '海鮮', count: 3 }, { tag: '夕焼け', count: 2 }] })).toBe(
      '知らずに訪れた人が『海鮮』と『夕焼け』に満足した町、A町。',
    );
    expect(buildPitch('A町', { goodPoints: [{ tag: '滝', count: 1 }] })).toBe('知らずに訪れた人が『滝』に満足した町、A町。');
    expect(buildPitch('A町', { goodPoints: [] })).toBeNull();
    expect(buildReportSync(t, [voice('s', 4, 'known', ['竹'])]).pitch).toBeNull();
  });
});
