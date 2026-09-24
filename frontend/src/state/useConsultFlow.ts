import { useCallback, useRef } from 'react';
import { ai } from '../ai';
import { townById } from '../data/towns';
import { isAbortError, sleep } from '../lib/sleep';
import { buildNarrowingTimeline, CONDITIONS_AT, type TimelineEvent } from '../lib/timeline';
import type { Conditions } from '../types';
import { useApp } from './context';
import { newId } from './ids';
import type { Action } from './reducer';
import { useSnapshot } from './selectors';
import { useReducedMotion } from './useReducedMotion';

const aiMessage = (text: string) => ({ id: newId('m'), role: 'ai' as const, text });

function eventToAction(ev: TimelineEvent): Action | null {
  switch (ev.type) {
    case 'dim':
      return { type: 'DIM_TOWNS', eliminations: ev.reasons };
    case 'light': {
      const names = ev.townIds.map((id) => townById(id)?.name ?? id).join('・');
      return {
        type: 'LIGHT_TOWNS',
        townIds: ev.townIds,
        message: aiMessage(`${names}に光を当てました。町を選ぶと、根拠の声と1日プランが見られます。`),
      };
    }
    case 'empty':
      return { type: 'SHOW_EMPTY', message: aiMessage('条件に合う穴場の町が見つかりませんでした。下の案で条件を緩めると見つかります。') };
    case 'showConditions':
      return null;
  }
}

/** 相談の送信〜光が当たるまでの進行（B1〜B3・D1-3。設計 6.2） */
export function useConsultFlow() {
  const { dispatch, tasks } = useApp();
  const snap = useSnapshot();
  const snapRef = useRef(snap);
  snapRef.current = snap;
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const narrow = useCallback(
    async (conditions: Conditions, t0: number, origin: 'send' | 'rerun', signal: AbortSignal) => {
      const recommendation = await ai.recommend(conditions, snapRef.current);
      if (signal.aborted) return;
      dispatch({
        type: 'SET_CONDITIONS',
        conditions,
        recommendation,
        message: aiMessage(
          origin === 'send' ? '条件を読み取りました。合わない町を外していきます。' : '条件を直して、探し直します。',
        ),
      });
      const events = buildNarrowingTimeline(recommendation.eliminated, recommendation.candidateIds, {
        reducedMotion: reducedRef.current,
        origin,
      });
      for (const ev of events) {
        const action = eventToAction(ev);
        if (!action) continue;
        // at は t0 からの時刻。interpret と待ち時間で過ぎた分を引いて予約する
        const delay = Math.max(0, ev.at - (performance.now() - t0));
        const timer = setTimeout(() => {
          if (!signal.aborted) dispatch(action);
        }, delay);
        signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
      }
    },
    [dispatch],
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const signal = tasks.start('consult');
      const t0 = performance.now();
      dispatch({ type: 'START_CONSULT', message: { id: newId('m'), role: 'user', text: trimmed } });
      try {
        const [result] = await Promise.all([ai.interpret(trimmed), sleep(CONDITIONS_AT, signal)]);
        if (signal.aborted) return;
        if (result.kind === 'clarify') {
          dispatch({ type: 'CLARIFY', message: aiMessage(result.question) });
          return;
        }
        await narrow(result.conditions, t0, 'send', signal);
      } catch (e) {
        if (!isAbortError(e)) throw e;
      }
    },
    [dispatch, narrow, tasks],
  );

  /** 条件タグを直したとき（B2）。条件の読み取りはやり直さない */
  const rerun = useCallback(
    async (conditions: Conditions) => {
      const signal = tasks.start('consult');
      try {
        await narrow(conditions, performance.now(), 'rerun', signal);
      } catch (e) {
        if (!isAbortError(e)) throw e;
      }
    },
    [narrow, tasks],
  );

  return { send, rerun };
}
