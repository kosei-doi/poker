import { useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { TOWNS } from '../data/towns';
import { allSpots } from '../lib/partner';
import {
  loadFavorites, loadPostedSpots, loadUserVoices, saveFavorites, savePostedSpots, saveUserVoices,
} from '../lib/storage';
import { AppContext, type TaskRunner } from './context';
import { createInitialState, reducer } from './reducer';

export function AppStateProvider({ children }: { children: ReactNode }) {
  // 投稿したスポットを先に読む（声の spotId の照合に、投稿の id も含めるため。設計 13.15.4）
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const posted = loadPostedSpots();
    return createInitialState(
      loadUserVoices(new Set(allSpots(posted).map((s) => s.id))),
      loadFavorites(new Set(TOWNS.map((t) => t.id))),
      posted,
    );
  });

  // 利用者の声だけを localStorage に保存する（保存できない環境でも state だけで動く）
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    saveUserVoices(state.userVoices);
  }, [state.userVoices]);

  // 気になる町も同じく保存する（N3-3・要件8章）
  const firstFav = useRef(true);
  useEffect(() => {
    if (firstFav.current) {
      firstFav.current = false;
      return;
    }
    saveFavorites(state.favorites);
  }, [state.favorites]);

  // 町が投稿したスポットも保存する（N6-5）
  const firstPosted = useRef(true);
  useEffect(() => {
    if (firstPosted.current) {
      firstPosted.current = false;
      return;
    }
    savePostedSpots(state.postedSpots);
  }, [state.postedSpots]);

  const controllers = useRef(new Map<string, AbortController>());
  const tasks = useMemo<TaskRunner>(
    () => ({
      start(key) {
        controllers.current.get(key)?.abort();
        const c = new AbortController();
        controllers.current.set(key, c);
        return c.signal;
      },
      abort(key) {
        controllers.current.get(key)?.abort();
        controllers.current.delete(key);
      },
      abortAll() {
        for (const c of controllers.current.values()) c.abort();
        controllers.current.clear();
      },
    }),
    [],
  );

  const value = useMemo(() => ({ state, dispatch, tasks }), [state, tasks]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
