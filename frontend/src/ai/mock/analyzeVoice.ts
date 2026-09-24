import {
  KNOWN_NEGATED, KNOWN_WORDS, NEGATIVE_WORDS, POSITIVE_WORDS, SATISFACTION_NEGATED, UNKNOWN_WORDS,
} from '../../data/dictionaries';
import { detectTags } from '../../data/vocab';
import { splitSentences } from '../../lib/text';
import type { Known, Satisfaction, VoiceAnalysis } from '../../types';

function removeAll(text: string, word: string): string {
  return text.split(word).join('　');
}

function judgeSatisfaction(text: string): { satisfaction: Satisfaction; determined: boolean; words: string[] } {
  let rest = text;
  let score = 0;
  const words: string[] = [];
  for (const w of SATISFACTION_NEGATED) {
    if (rest.includes(w)) {
      score -= 1;
      words.push(w);
      rest = removeAll(rest, w);
    }
  }
  for (const w of POSITIVE_WORDS) {
    if (rest.includes(w)) {
      score += 1;
      words.push(w);
    }
  }
  for (const w of NEGATIVE_WORDS) {
    if (rest.includes(w)) {
      score -= 1;
      words.push(w);
    }
  }
  if (words.length === 0) return { satisfaction: 3, determined: false, words };
  return { satisfaction: Math.min(5, Math.max(1, 3 + score)) as Satisfaction, determined: true, words };
}

function judgeKnown(text: string): Known {
  let rest = text;
  for (const w of KNOWN_NEGATED) rest = removeAll(rest, w);
  if (UNKNOWN_WORDS.some((w) => rest.includes(w))) return 'unknown';
  if (KNOWN_WORDS.some((w) => rest.includes(w))) return 'known';
  return 'unsure';
}

/** 感想から満足度・知っていたか・根拠の文・特徴のタグを読み取る（D2-2） */
export function analyzeVoiceSync(text: string): VoiceAnalysis {
  const sat = judgeSatisfaction(text);
  const { tags, matchedWords } = detectTags(text);
  const sentences = splitSentences(text);
  const evidence =
    sentences.find((s) => sat.words.some((w) => s.includes(w))) ??
    sentences.find((s) => matchedWords.some((w) => s.includes(w))) ??
    sentences[0] ??
    text.trim();
  return {
    satisfaction: sat.satisfaction,
    satisfactionDetermined: sat.determined,
    known: judgeKnown(text),
    tags,
    evidence,
  };
}
