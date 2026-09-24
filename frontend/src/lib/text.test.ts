import { describe, expect, it } from 'vitest';
import { normalizeText, splitSentences } from './text';

describe('normalizeText', () => {
  it('全角数字を半角に', () => {
    expect(normalizeText('予算は１万円、３人')).toBe('予算は1万円、3人');
  });
  it('漢数字は「人」「万」「時間」などの前だけ数字にする', () => {
    expect(normalizeText('友達三人で二時間以内、予算一万円')).toBe('友達3人で2時間以内、予算1万円');
    expect(normalizeText('一緒に十分楽しめる')).toBe('一緒に十分楽しめる');
  });
});

describe('splitSentences', () => {
  it('。！？改行で分ける', () => {
    expect(splitSentences('最高。また来たい！\n静か？')).toEqual(['最高。', 'また来たい！', '静か？']);
    expect(splitSentences('句点なし')).toEqual(['句点なし']);
  });
});
