import type { Companion } from '../types';

// 満足度（要件 6章 analyzeVoice）。否定形は先に照合して本文から消す
export const SATISFACTION_NEGATED = ['良くなかった', 'よくなかった'];
export const POSITIVE_WORDS = ['最高', 'また来たい', '感動', '良かった', 'よかった', '素晴らしい', '大満足'];
export const NEGATIVE_WORDS = ['残念', '微妙', 'がっかり', '不便', '期待外れ'];

// 知っていたか
export const KNOWN_NEGATED = ['有名じゃない', '有名ではない', '知られていない'];
export const UNKNOWN_WORDS = ['知らなかった', '初めて知った', '名前も知らない'];
export const KNOWN_WORDS = ['前から気になって', '有名', '知っていた', '何度目'];

// 不満（要件 6章 buildReport）。表記ゆれは代表語にまとめる
export const COMPLAINT_WORDS: { word: string; variants: string[] }[] = [
  { word: '駐車場', variants: ['駐車場'] },
  { word: '分かりにくい', variants: ['分かりにくい', 'わかりにくい', '分かりづらい', 'わかりづらい'] },
  { word: '混んでいる', variants: ['混んで', '混雑'] },
  { word: '高い', variants: ['高い'] },
  { word: '閉まっていた', variants: ['閉まって'] },
  { word: '不便', variants: ['不便'] },
  { word: '案内がない', variants: ['案内がない', '案内が少な'] },
];

// 誰と（設計 4.2 ④）。上から優先。pattern が当たった最初の組を採る
export const COMPANION_RULES: { companion: Companion; pattern: RegExp }[] = [
  { companion: '家族と', pattern: /家族|子連れ|子ども|子供|親と/ },
  { companion: '友達と', pattern: /友達|友人|仲間|ともだち/ },
  { companion: 'ふたり', pattern: /カップル|恋人|夫婦|彼女と|彼氏と/ },
  { companion: 'ひとり', pattern: /ひとり|(?<!\d)1人|ソロ/ },
  { companion: 'ふたり', pattern: /ふたり|(?<!\d)2人/ },
];
