const KANJI_DIGITS: Record<string, string> = {
  一: '1', 二: '2', 三: '3', 四: '4', 五: '5', 六: '6', 七: '7', 八: '8', 九: '9', 十: '10',
};

/**
 * 全角英数字を半角にし、漢数字（一〜十）は直後が「人」「泊」「万」「千」「時間」「分以内」のときだけ数字にする。
 * 「一緒」「十分楽しめる」は変えない（「分」は「分以内」に限る）。
 */
export function normalizeText(text: string): string {
  const halfWidth = text
    .replace(/[０-９Ａ-Ｚａ-ｚ．]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/，/g, ',');
  return halfWidth.replace(/([一二三四五六七八九十])(?=(人|泊|万|千|時間|分以内))/g, (c) => KANJI_DIGITS[c]);
}

/** 文に分ける（。！!？?改行）。区切り記号は前の文に残す。空の文は捨てる */
export function splitSentences(text: string): string[] {
  const parts = text.match(/[^。！!？?\n]+[。！!？?]*/g) ?? [];
  return parts.map((s) => s.trim()).filter((s) => s.length > 0);
}
