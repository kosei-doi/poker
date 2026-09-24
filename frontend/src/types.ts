// ---- 語彙（要件 7.3）----
export const TAGS = [
  '静か', '自然', '渓谷', '滝', '海', '海鮮', '竹', '散策', '寺社', '高台',
  '夕焼け', '星空', '温泉', 'そば', 'カフェ', '歴史', '体験', '紅葉', '朝市', '避暑',
] as const;
/** 表示時に "#" を付ける。内部は "#" なし */
export type Tag = (typeof TAGS)[number];

export type TagCount = { tag: Tag; count: number };

// ---- 町・スポット・声（要件 7.2）----
export type TownId = string;
export type SpotId = string;
export const COMPANIONS = ['友達と', 'ひとり', 'ふたり', '家族と'] as const;
export type Companion = (typeof COMPANIONS)[number];
export type SpotKind = '食べる' | '見る' | '体験';
/** 知っていた / 知らなかった / 不明 */
export type Known = 'known' | 'unknown' | 'unsure';
export type Satisfaction = 1 | 2 | 3 | 4 | 5;

export interface Town {
  id: TownId;
  name: string;
  /** 行政区域コード（boundaries.json の properties.code と一致） */
  code: string;
  /** 東京駅からの片道所要時間（分） */
  oneWayMin: number;
  /** 往復交通費（円・1人） */
  roundTripYen: number;
  companions: Companion[];
  /** [lat, lng] 地図ラベルの位置 */
  labelPoint: [number, number];
}

export interface Spot {
  id: SpotId;
  townId: TownId;
  name: string;
  kind: SpotKind;
  description: string;
  lat: number;
  lng: number;
  /** 1日プランで回る順番（1始まり） */
  order: number;
  stayMin: number;
  /** 次のスポットまでの移動時間。最後のスポットは 0 */
  moveMin: number;
  /** 費用の目安（1人） */
  costYen: number;
}

export interface Voice {
  id: string;
  spotId: SpotId;
  text: string;
  satisfaction: Satisfaction;
  known: Known;
  tags: Tag[];
  evidence: string;
  /** ISO 8601 */
  createdAt: string;
  source: 'seed' | 'user';
}

// ---- 有名地（要件 7.5）----
export interface FamousPlace {
  id: string;
  name: string;
  /** 照合語（長い順に照合する） */
  aliases: string[];
  tags: Tag[];
}

// ---- 相談の条件（B2・D4）----
export type Stay = '日帰り' | '泊まり';
export interface Conditions {
  companion: Companion | null;
  /** 表示のみ（要件 7.4） */
  partySize: number | null;
  stay: Stay | null;
  /** 1人あたり */
  budgetYen: number | null;
  maxOneWayMin: number | null;
  moods: Tag[];
  famous: FamousPlace | null;
  /** D4-3 の「〇〇」 */
  unknownFamous: string | null;
}

// ---- 点数（要件 5章）----
export interface SpotStats {
  spotId: SpotId;
  count: number;
  satisfaction: number;
  knownRatio: number;
  fame: number;
  hole: number;
}
export interface TownStats {
  townId: TownId;
  count: number;
  satisfaction: number;
  fame: number;
  hole: number;
}
export interface StatsIndex {
  mean: number;
  spots: Record<SpotId, SpotStats>;
  /** 声0件の町は null */
  towns: Record<TownId, TownStats | null>;
}
export type HoleLabel = 'ど穴場' | '穴場' | 'やや穴場';

// ---- AI の出力（要件 6章）----
export type InterpretResult =
  | { kind: 'conditions'; conditions: Conditions }
  | { kind: 'clarify'; question: string };

export type RuleId =
  | 'dayTrip' | 'oneWay' | 'budget' | 'companion' | 'mood' | 'famous'
  | 'satisfaction' | 'hole' | 'rank';

export interface Elimination {
  townId: TownId;
  rule: RuleId;
  reason: string;
}

export interface TownSummary {
  townId: TownId;
  catchphrase: string;
  tags: TagCount[];
}

export interface CandidateView {
  townId: TownId;
  stats: TownStats;
  summary: TownSummary;
  matchRate: number | null;
  matchedTags: Tag[];
  famousEvidence: Voice | null;
  quotes: Voice[];
  reasonText: string | null;
}

export type RelaxRule = Exclude<RuleId, 'satisfaction' | 'hole' | 'rank'>;
export interface RelaxHint {
  rule: RelaxRule | null;
  label: string;
  townCount: number;
  /** このヒントを採ったときに条件へ当てる差分（押すと探し直す）。null は自動で直せないもの */
  patch: Partial<Conditions> | null;
}

export interface Recommendation {
  eliminated: Elimination[];
  candidateIds: TownId[];
  relaxHints: RelaxHint[];
  notices: string[];
}

export interface VoiceAnalysis {
  satisfaction: Satisfaction;
  satisfactionDetermined: boolean;
  known: Known;
  tags: Tag[];
  evidence: string;
}

export interface TownReport {
  townId: TownId;
  goodPoints: TagCount[];
  complaints: { word: string; count: number }[];
  pitch: string | null;
}

// ---- 感想を確定したときの変化（D2-5）----
export type BeforeAfter = [number, number];
export interface VoiceChange {
  spot: { hole: BeforeAfter; count: BeforeAfter; satisfaction: BeforeAfter; fame: BeforeAfter };
  town: { hole: BeforeAfter; count: BeforeAfter };
  tags: { tag: Tag; before: number; after: number; isNew: boolean }[];
  catchphrase: [string, string];
}
