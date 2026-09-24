import { createContext, useContext, type Dispatch } from 'react';
import type { Action, AppState } from './reducer';

export interface TaskRunner {
  /** 同じ key の前のタスクを止めてから新しい AbortSignal を渡して実行する */
  start(key: string): AbortSignal;
  abort(key: string): void;
  abortAll(): void;
}

export interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
  tasks: TaskRunner;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const v = useContext(AppContext);
  if (!v) throw new Error('AppStateProvider の外で useApp が呼ばれた');
  return v;
}
