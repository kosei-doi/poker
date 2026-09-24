import { summarizeAll } from '../data/seed';
import { SEED_VOICES } from '../data/voices';
import type {
  Conditions, Elimination, Recommendation, SpotId, TownId, TownSummary, Voice, VoiceAnalysis, VoiceChange,
} from '../types';

export type ConsultPhase = 'idle' | 'thinking' | 'narrowing' | 'done';

/** 地図の表示範囲（N1）。最初は日本全体 */
export type MapView = 'japan' | 'kenpoku';

export interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

export type VoiceModalState =
  | { step: 'writing'; spotId: SpotId; draft: string }
  | { step: 'analyzing'; spotId: SpotId; text: string }
  | { step: 'review'; spotId: SpotId; text: string; analysis: VoiceAnalysis }
  | { step: 'result'; spotId: SpotId; change: VoiceChange };

export interface AppState {
  /** 利用者が確定した声（localStorage に保存する唯一のもの） */
  userVoices: Voice[];
  summaries: Record<TownId, TownSummary>;
  messages: Message[];
  /** null の間は条件タグを出さない（聞き返しのときも null） */
  conditions: Conditions | null;
  recommendation: Recommendation | null;
  consultPhase: ConsultPhase;
  /** 演出で暗くなった町 */
  dimmed: TownId[];
  /** 暗くなった順の理由（NarrowingLog） */
  narrowingLog: Elimination[];
  lit: TownId[];
  showEmpty: boolean;
  selectedTownId: TownId | null;
  noVoiceTownId: TownId | null;
  voiceModal: VoiceModalState | null;
  reportTownId: TownId | null;
  /** N1: 日本全体か県北か。町を選ぶと必ず 'kenpoku'（設計 決定#16） */
  mapView: MapView;
  /** N1-3: 押した都道府県の名前（「この地域はまだ準備中です」）。null で非表示 */
  prefNotice: string | null;
  /** N3-3: 気になる町（押した順）。localStorage に保存 */
  favorites: TownId[];
}

export type Action =
  | { type: 'START_CONSULT'; message: Message }
  | { type: 'CLARIFY'; message: Message }
  | { type: 'SET_CONDITIONS'; conditions: Conditions; recommendation: Recommendation; message?: Message }
  | { type: 'DIM_TOWNS'; eliminations: Elimination[] }
  | { type: 'LIGHT_TOWNS'; townIds: TownId[]; message: Message }
  | { type: 'SHOW_EMPTY'; message: Message }
  | { type: 'SELECT_TOWN'; townId: TownId | null }
  | { type: 'SHOW_NO_VOICE'; townId: TownId | null }
  | { type: 'OPEN_VOICE'; spotId: SpotId }
  | { type: 'SET_VOICE_STEP'; voiceModal: VoiceModalState }
  | { type: 'CLOSE_VOICE' }
  | { type: 'ADD_VOICE'; voice: Voice }
  | { type: 'SET_SUMMARY'; summary: TownSummary }
  | { type: 'OPEN_REPORT'; townId: TownId }
  | { type: 'CLOSE_REPORT' }
  /** 'japan' にすると選んだ町と地図上の通知を消す（N1-4） */
  | { type: 'SET_MAP_VIEW'; view: MapView }
  | { type: 'SHOW_PREF_NOTICE'; name: string | null }
  | { type: 'TOGGLE_FAVORITE'; townId: TownId }
  | { type: 'RESET' };

export function createInitialState(userVoices: Voice[] = [], favorites: TownId[] = []): AppState {
  return {
    userVoices,
    summaries: summarizeAll([...SEED_VOICES, ...userVoices]),
    messages: [],
    conditions: null,
    recommendation: null,
    consultPhase: 'idle',
    dimmed: [],
    narrowingLog: [],
    lit: [],
    showEmpty: false,
    selectedTownId: null,
    noVoiceTownId: null,
    voiceModal: null,
    reportTownId: null,
    mapView: 'japan',
    prefNotice: null,
    favorites,
  };
}

const narrowingCleared = {
  recommendation: null,
  dimmed: [],
  narrowingLog: [],
  lit: [],
  showEmpty: false,
  selectedTownId: null,
  noVoiceTownId: null,
} satisfies Partial<AppState>;

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'START_CONSULT':
      return {
        ...state,
        ...narrowingCleared,
        messages: [...state.messages, action.message],
        conditions: null,
        consultPhase: 'thinking',
      };
    case 'CLARIFY':
      return { ...state, messages: [...state.messages, action.message], conditions: null, consultPhase: 'idle' };
    case 'SET_CONDITIONS':
      return {
        ...state,
        ...narrowingCleared,
        messages: action.message ? [...state.messages, action.message] : state.messages,
        conditions: action.conditions,
        recommendation: action.recommendation,
        consultPhase: 'narrowing',
      };
    case 'DIM_TOWNS': {
      const fresh = action.eliminations.filter((e) => !state.dimmed.includes(e.townId));
      if (fresh.length === 0) return state;
      return {
        ...state,
        dimmed: [...state.dimmed, ...fresh.map((e) => e.townId)],
        narrowingLog: [...state.narrowingLog, ...fresh],
      };
    }
    case 'LIGHT_TOWNS':
      return { ...state, lit: action.townIds, consultPhase: 'done', messages: [...state.messages, action.message] };
    case 'SHOW_EMPTY':
      return { ...state, showEmpty: true, consultPhase: 'done', messages: [...state.messages, action.message] };
    case 'SELECT_TOWN':
      return {
        ...state,
        selectedTownId: action.townId,
        noVoiceTownId: null,
        prefNotice: null,
        mapView: action.townId !== null ? 'kenpoku' : state.mapView,
      };
    case 'SHOW_NO_VOICE':
      return { ...state, noVoiceTownId: action.townId };
    case 'OPEN_VOICE':
      return { ...state, voiceModal: { step: 'writing', spotId: action.spotId, draft: '' } };
    case 'SET_VOICE_STEP':
      return { ...state, voiceModal: action.voiceModal };
    case 'CLOSE_VOICE':
      return { ...state, voiceModal: null };
    case 'ADD_VOICE':
      if (state.userVoices.some((v) => v.id === action.voice.id)) return state;
      return { ...state, userVoices: [...state.userVoices, action.voice] };
    case 'SET_SUMMARY':
      return { ...state, summaries: { ...state.summaries, [action.summary.townId]: action.summary } };
    case 'OPEN_REPORT':
      return { ...state, reportTownId: action.townId };
    case 'CLOSE_REPORT':
      return { ...state, reportTownId: null };
    case 'SET_MAP_VIEW':
      if (action.view === 'japan') {
        return { ...state, mapView: 'japan', selectedTownId: null, noVoiceTownId: null, prefNotice: null };
      }
      return { ...state, mapView: 'kenpoku', prefNotice: null };
    case 'SHOW_PREF_NOTICE':
      return { ...state, prefNotice: action.name };
    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        favorites: state.favorites.includes(action.townId)
          ? state.favorites.filter((id) => id !== action.townId)
          : [...state.favorites, action.townId],
      };
    case 'RESET':
      return createInitialState([], []);
  }
}
