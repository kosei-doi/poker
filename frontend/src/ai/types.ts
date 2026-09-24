import type {
  Conditions, InterpretResult, Recommendation, Spot, StatsIndex, Town, TownId, TownReport, TownSummary, Voice,
  VoiceAnalysis,
} from '../types';

export interface DataSnapshot {
  towns: Town[];
  spots: Spot[];
  voices: Voice[];
  stats: StatsIndex;
  summaries: Record<TownId, TownSummary>;
}

/**
 * 画面が使う AI の窓口。すべて非同期にしておき、Claude API に替えても画面側を変えない（設計 4.1）。
 * 待ち時間はここに入れない（設計 決定#3）。
 */
export interface AnabaAI {
  interpret(text: string): Promise<InterpretResult>;
  recommend(conditions: Conditions, data: DataSnapshot): Promise<Recommendation>;
  analyzeVoice(text: string, spot: Spot): Promise<VoiceAnalysis>;
  /** voices は町の声だけ */
  summarizeTown(town: Town, voices: Voice[]): Promise<TownSummary>;
  buildReport(town: Town, voices: Voice[]): Promise<TownReport>;
}
