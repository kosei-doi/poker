import { useCallback } from 'react';
import { clearUserVoices } from '../lib/storage';
import { useApp } from './context';

/** デモ用リセット（B5）。確認なしで即時に戻す（設計 決定#6） */
export function useReset() {
  const { dispatch, tasks } = useApp();
  return useCallback(() => {
    tasks.abortAll();
    clearUserVoices();
    dispatch({ type: 'RESET' });
  }, [dispatch, tasks]);
}
