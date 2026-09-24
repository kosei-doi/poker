export type SpotCategory =
  | 'gourmet'  // 食・カフェ・直売所
  | 'nature'   // 自然・散策
  | 'view'     // 絶景・夕日・星空
  | 'onsen'    // 温泉・銭湯
  | 'craft'    // 手仕事・体験
  | 'history'; // 歴史・文化・町並み

/** 足跡を残した人の立場。地図上で色分けする */
export type FootprintUserType = 'visitor' | 'local';

export interface Footprint {
  id: string;
  spotId: string;
  userName: string;
  userType: FootprintUserType;
  /** 旅人なら「東京から」、地元なら「安曇野在住20年」など */
  profile: string;
  date: string; // YYYY-MM-DD
  comment: string;
  rating: number;
  lat: number;
  lng: number;
}

export interface SpotAuthor {
  name: string;
  /** 例: 「安曇野生まれ・農家」 */
  relation: string;
}

export interface Spot {
  id: string;
  name: string;
  category: SpotCategory;
  area: string;
  address: string;
  lat: number;
  lng: number;
  catchphrase: string;
  description: string;
  /** 地元の人だけが知っている楽しみ方 */
  localTip: string;
  bestTime: string;
  stayMinutes: number;
  imageUrl: string;
  tags: string[];
  author: SpotAuthor;
  postedAt: string; // YYYY-MM-DD
  footprints: Footprint[];
}

export interface PlanPreferences {
  area: string;
  duration: string;
  interests: string[];
  companion: string;
  pace: string;
  transport: string;
  note?: string;
  /** 詳細画面から「ここを含む旅プラン」を選んだときのスポット */
  mustIncludeSpotId?: string;
}

export interface TripPlanItem {
  time: string;
  spotId: string | null;
  title: string;
  description: string;
  localTip: string | null;
  transport: string | null;
  durationMin: number;
}

export interface TripPlanDay {
  day: number;
  theme: string;
  items: TripPlanItem[];
}

export interface TripPlan {
  title: string;
  summary: string;
  highlights: string[];
  days: TripPlanDay[];
  tips: string[];
}
