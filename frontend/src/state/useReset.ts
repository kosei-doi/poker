import { useCallback } from 'react';
import { clearFavorites, clearPostedSpots, clearUserVoices } from '../lib/storage';
import { useApp } from './context';

/** デモ用リセット（B5）。確認なしで即時に戻す（設計 決定#6）。声・気になる町・投稿したスポットを消し、地図は日本全体に戻す。今いるページは変えない */
export function useReset() {
  const { dispatch, tasks } = useApp();
  return useCallback(() => {
    tasks.abortAll();
    clearUserVoices();
    clearFavorites();
    clearPostedSpots();
    dispatch({ type: 'RESET' });
  }, [dispatch, tasks]);
}
