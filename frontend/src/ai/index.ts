import { mockAI } from './mock';
import type { AnabaAI } from './types';

/** 画面が使う AI。Claude API に差し替えるときはここだけを替える（設計 4.5） */
export const ai: AnabaAI = mockAI;
