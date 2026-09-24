import type { AnabaAI } from '../types';
import { analyzeVoiceSync } from './analyzeVoice';
import { buildReportSync } from './buildReport';
import { interpretSync } from './interpret';
import { recommendSync } from './recommend';
import { summarizeTownSync } from './summarizeTown';

/** 固定ルールで動くモック（要件 6章）。同期関数を Promise で包むだけ */
export const mockAI: AnabaAI = {
  interpret: async (text) => interpretSync(text),
  recommend: async (conditions, data) => recommendSync(conditions, data),
  analyzeVoice: async (text) => analyzeVoiceSync(text),
  summarizeTown: async (town, voices) => summarizeTownSync(town, voices),
  buildReport: async (town, voices) => buildReportSync(town, voices),
};
