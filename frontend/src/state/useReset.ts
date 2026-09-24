import { useCallback } from 'react';
import { clearFavorites, clearUserVoices } from '../lib/storage';
import { useApp } from './context';

/** デモ用リセット（B5）。確認なしで即時に戻す（設計 決定#6）。声・気になる町を消し、地図は日本全体に戻す。今いるページは変えない */
export function useReset() {
  const { dispatch, tasks } = useApp();
  return useCallback(() => {
    tasks.abortAll();
    clearUserVoices();
    clearFavorites();
    dispatch({ type: 'RESET' });
  }, [dispatch, tasks]);
}
