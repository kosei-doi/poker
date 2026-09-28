export type Vibe = 'nature' | 'food' | 'craft' | 'night' | 'history';
export type PlaceKind = 'event' | 'food' | 'photo' | 'stay';
export type WithWhom = 'friends' | 'solo' | 'couple' | 'family';

export interface Voice {
  id: string;
  name: string;
  from: string;
  date: string;
  text: string;
  tag: string;
  rating: number;
}

export interface Place {
  id: string;
  name: string;
  kind: PlaceKind;
  /** 目安の滞在時間（分） */
  stay: number;
  desc: string;
  tip?: string;
  lat: number;
  lng: number;
  /** 期間限定の催しだけ入る */
  period?: string;
}

export interface Access {
  /** 現実的な移動手段 */
  mode: '車' | '電車' | '車 or 電車';
  from: string;
  minutes: number;
}

export interface Region {
  id: string;
  name: string;
  pref: string;
  catch: string;
  image: string;
  /** 1〜5。低いほど知られていない */
  fame: number;
  /** 1〜5。行った人の評価 */
  satisfaction: number;
  access: Access;
  /** 1人あたり1日の想定 */
  budget: number;
  withWhom: WithWhom[];
  vibes: Vibe[];
  /** いま行く理由 */
  season: string;
  /** そのまま送れる誘い文句 */
  invite: string;
  lat: number;
  lng: number;
  places: Place[];
  voices: Voice[];
}

export interface PlanStep {
  time: string;
  place: Place;
  note: string;
}

export interface Plan {
  regionId: string;
  title: string;
  steps: PlanStep[];
  totalMinutes: number;
  budget: number;
  transport: string;
}

export interface Filters {
  maxMinutes: number;
  maxBudget: number;
  withWhom: WithWhom | 'any';
  vibe: Vibe | 'any';
}
