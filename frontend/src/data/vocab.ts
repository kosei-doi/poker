import { TAGS, type Tag } from '../types';

export interface TagDef {
  tag: Tag;
  /** 感想文・相談文から判定するための言葉（要件 7.3） */
  words: string[];
  /** 町の一言に使う言葉（要件 7.3） */
  phrase: string;
}

export const TAG_DEFS: Record<Tag, TagDef> = {
  静か: { tag: '静か', words: ['静か', '人が少な', '人がいな', '独り占め', 'のんびり', '落ち着'], phrase: '静けさ' },
  自然: { tag: '自然', words: ['自然', '緑', '森', '山あい'], phrase: '緑' },
  渓谷: { tag: '渓谷', words: ['渓谷', '峡谷', '谷'], phrase: '渓谷' },
  滝: { tag: '滝', words: ['滝'], phrase: '滝' },
  海: { tag: '海', words: ['海岸', '海', '浜'], phrase: '海' },
  海鮮: { tag: '海鮮', words: ['海鮮', '魚', '刺身', 'あんこう', '寿司'], phrase: '海鮮' },
  竹: { tag: '竹', words: ['竹林', '竹'], phrase: '竹' },
  散策: { tag: '散策', words: ['散策', '散歩', '歩い', '歩き', '歩け', '町並み', 'ぶらぶら'], phrase: '散歩道' },
  寺社: { tag: '寺社', words: ['神社', '古刹', 'お参り', '寺'], phrase: '古社' },
  高台: { tag: '高台', words: ['高台', '展望', '見晴らし', '眺め'], phrase: '眺め' },
  夕焼け: { tag: '夕焼け', words: ['夕焼け', '夕日', '日の入り'], phrase: '夕焼け' },
  星空: { tag: '星空', words: ['星'], phrase: '星空' },
  温泉: { tag: '温泉', words: ['温泉', '湯'], phrase: '湯' },
  そば: { tag: 'そば', words: ['そば', '蕎麦'], phrase: 'そば' },
  カフェ: { tag: 'カフェ', words: ['カフェ', '喫茶', 'コーヒー'], phrase: 'カフェ' },
  歴史: { tag: '歴史', words: ['歴史', '古い', '昔', '城'], phrase: '歴史' },
  体験: { tag: '体験', words: ['体験', '手作り', '作っ'], phrase: '体験' },
  紅葉: { tag: '紅葉', words: ['紅葉', 'もみじ'], phrase: '紅葉' },
  朝市: { tag: '朝市', words: ['朝市', '市場'], phrase: '朝市' },
  避暑: { tag: '避暑', words: ['避暑', '涼し'], phrase: '涼しさ' },
};

/** 全タグの判定語を長い順に並べたもの（「海鮮」を「海」より先に当てるため） */
const WORD_INDEX: { word: string; tag: Tag }[] = TAGS.flatMap((tag) =>
  TAG_DEFS[tag].words.map((word) => ({ word, tag })),
).sort((a, b) => b.word.length - a.word.length);

/**
 * 文からタグを判定する。長い語から照合し、当たった部分を消してから次を照合する。
 * 結果は TAGS の順。
 */
export function detectTags(text: string): { tags: Tag[]; matchedWords: string[] } {
  let rest = text;
  const found = new Set<Tag>();
  const matchedWords: string[] = [];
  for (const { word, tag } of WORD_INDEX) {
    if (rest.includes(word)) {
      found.add(tag);
      matchedWords.push(word);
      rest = rest.split(word).join('　');
    }
  }
  return { tags: TAGS.filter((t) => found.has(t)), matchedWords };
}

export function sortTags(tags: Iterable<Tag>): Tag[] {
  const set = new Set(tags);
  return TAGS.filter((t) => set.has(t));
}

export function tagIndex(tag: Tag): number {
  return TAGS.indexOf(tag);
}
