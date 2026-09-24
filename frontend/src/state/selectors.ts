import { useMemo } from 'react';
import type { DataSnapshot } from '../ai/types';
import { SPOTS } from '../data/spots';
import { TOWNS } from '../data/towns';
import { SEED_VOICES } from '../data/voices';
import { buildCandidateView } from '../lib/candidate';
import { computeAllStats } from '../lib/stats';
import type { CandidateView, TownId } from '../types';
import { useApp } from './context';

/** 今の声・点数・一言とタグ（点数は保存せず毎回導出する） */
export function useSnapshot(): DataSnapshot {
  const { state } = useApp();
  return useMemo(() => {
    const voices = [...SEED_VOICES, ...state.userVoices];
    return { towns: TOWNS, spots: SPOTS, voices, stats: computeAllStats(TOWNS, SPOTS, voices), summaries: state.summaries };
  }, [state.userVoices, state.summaries]);
}

/** 提案カードの中身（設計 決定#10）。顔ぶれと並びは相談時のまま、中身は今のデータから */
export function useCandidateViews(): CandidateView[] {
  const { state } = useApp();
  const snap = useSnapshot();
  return useMemo(() => {
    if (!state.recommendation) return [];
    return state.recommendation.candidateIds
      .map((id) => buildCandidateView(id, state.conditions, snap))
      .filter((v): v is CandidateView => v !== null);
  }, [state.recommendation, state.conditions, snap]);
}

/** 任意の町の中身（町のパネル用。光っていない町も開く） */
export function useTownView(townId: TownId | null): CandidateView | null {
  const { state } = useApp();
  const snap = useSnapshot();
  return useMemo(
    () => (townId ? buildCandidateView(townId, state.conditions, snap) : null),
    [townId, state.conditions, snap],
  );
}
