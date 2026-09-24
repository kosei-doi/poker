import { useCallback, useRef } from 'react';
import { ai } from '../ai';
import { spotById } from '../data/spots';
import { townById } from '../data/towns';
import { voicesOfTown } from '../lib/candidate';
import { isAbortError, sleep } from '../lib/sleep';
import { computeAllStats, diffVoiceChange } from '../lib/stats';
import type { SpotId, Voice, VoiceAnalysis } from '../types';
import { useApp } from './context';
import { newId } from './ids';
import { useSnapshot } from './selectors';

export const ANALYZE_WAIT_MS = 1500;

/** 感想の読み取り〜確定〜差分表示の進行（D2・D5-3。設計 6.2） */
export function useVoiceFlow() {
  const { state, dispatch, tasks } = useApp();
  const snap = useSnapshot();
  const snapRef = useRef(snap);
  snapRef.current = snap;
  const summariesRef = useRef(state.summaries);
  summariesRef.current = state.summaries;

  const open = useCallback((spotId: SpotId) => dispatch({ type: 'OPEN_VOICE', spotId }), [dispatch]);

  const close = useCallback(() => {
    tasks.abort('voice');
    dispatch({ type: 'CLOSE_VOICE' });
  }, [dispatch, tasks]);

  const submit = useCallback(
    async (spotId: SpotId, text: string) => {
      const spot = spotById(spotId);
      if (!spot || !text.trim()) return;
      const signal = tasks.start('voice');
      dispatch({ type: 'SET_VOICE_STEP', voiceModal: { step: 'analyzing', spotId, text } });
      try {
        const [analysis] = await Promise.all([ai.analyzeVoice(text, spot), sleep(ANALYZE_WAIT_MS, signal)]);
        if (signal.aborted) return;
        dispatch({ type: 'SET_VOICE_STEP', voiceModal: { step: 'review', spotId, text, analysis } });
      } catch (e) {
        if (!isAbortError(e)) throw e;
      }
    },
    [dispatch, tasks],
  );

  const rewrite = useCallback(
    (spotId: SpotId, text: string) => dispatch({ type: 'SET_VOICE_STEP', voiceModal: { step: 'writing', spotId, draft: text } }),
    [dispatch],
  );

  const confirm = useCallback(
    async (spotId: SpotId, text: string, analysis: VoiceAnalysis) => {
      const spot = spotById(spotId);
      const town = spot && townById(spot.townId);
      if (!spot || !town) return;
      const signal = tasks.start('voice');
      const current = snapRef.current;
      const before = current.stats;
      const beforeSummary = summariesRef.current[town.id];
      const voice: Voice = {
        id: newId('user'),
        spotId,
        text,
        satisfaction: analysis.satisfaction,
        known: analysis.known,
        tags: analysis.tags,
        evidence: analysis.evidence,
        createdAt: new Date().toISOString(),
        source: 'user',
      };
      dispatch({ type: 'ADD_VOICE', voice });
      const voicesAfter = [...current.voices, voice];
      const after = computeAllStats(current.towns, current.spots, voicesAfter);
      try {
        const afterSummary = await ai.summarizeTown(town, voicesOfTown(town.id, { spots: current.spots, voices: voicesAfter }));
        if (signal.aborted) return;
        dispatch({ type: 'SET_SUMMARY', summary: afterSummary });
        const change = diffVoiceChange(before, after, beforeSummary, afterSummary, spotId, town.id);
        dispatch({ type: 'SET_VOICE_STEP', voiceModal: { step: 'result', spotId, change } });
      } catch (e) {
        if (!isAbortError(e)) throw e;
      }
    },
    [dispatch, tasks],
  );

  return { open, close, submit, rewrite, confirm };
}
