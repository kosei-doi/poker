import { useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { SPOTS } from '../data/spots';
import { loadUserVoices, saveUserVoices } from '../lib/storage';
import { AppContext, type TaskRunner } from './context';
import { createInitialState, reducer } from './reducer';

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    createInitialState(loadUserVoices(new Set(SPOTS.map((s) => s.id)))),
  );

  // 利用者の声だけを localStorage に保存する（保存できない環境でも state だけで動く）
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    saveUserVoices(state.userVoices);
  }, [state.userVoices]);

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
