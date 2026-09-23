export type EventCategory = 
  | 'festival'    // 祭り・伝統行事
  | 'marche'      // マルシェ・朝市・食
  | 'workshop'    // 体験・クラフト・学び
  | 'nature'      // 自然・農業・アウトドア
  | 'culture'     // アート・音楽・文化
  | 'volunteer';   // 地域づくり・お手伝い

export interface Footprint {
  id: string;
  eventId: string;
  userName: string;
  userType: '観光客' | '移住検討中' | 'ワーケーション' | '地元ファン';
  avatarUrl?: string;
  date: string;
  comment: string;
  rating: number;
  highlightTag?: string;
}

export interface NearbySpot {
  id: string;
  name: string;
  category: string;
  distance: string;
  description: string;
}

export interface EventItem {
  id: string;
  title: string;
  category: EventCategory;
  date: string;
  time: string;
  locationName: string;
  address: string;
  lat: number;
  lng: number;
  description: string;
  catchphrase: string;
  organizer: {
    name: string;
    role: string;
    avatar: string;
    story: string;
  };
  imageUrl: string;
  tags: string[];
  recommendedFor: string[];
  footprints: Footprint[];
  nearbySpots: NearbySpot[];
  capacity?: string;
  fee?: string;
}

export interface TourPlanItem {
  time: string;
  title: string;
  type: 'event' | 'spot' | 'meal' | 'break';
  description: string;
  locationName: string;
  tips?: string;
}

export interface TourPlan {
  id: string;
  title: string;
  subtitle: string;
  theme: string;
  target: string;
  duration: string;
  recommendedTransport: string;
  items: TourPlanItem[];
}
