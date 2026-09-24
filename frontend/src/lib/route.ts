import { TOWNS } from '../data/towns';
import type { TownId } from '../types';

export type Page = 'search' | 'dashboard' | 'partner' | 'about';
/** 投稿者ページのタブ（N6-1） */
export type PartnerTab = 'post' | 'reviews' | 'report';
export const PARTNER_TABS: { tab: PartnerTab; label: string }[] = [
  { tab: 'post', label: '投稿する' },
  { tab: 'reviews', label: 'レビュー' },
  { tab: 'report', label: '町向けレポート' },
];

export type Route =
  | { page: 'search'; town: TownId | null }
  | { page: 'dashboard' }
  | { page: 'partner'; town: TownId | null; tab: PartnerTab }
  | { page: 'about' };

export const PAGES: { page: Page; label: string; title: string }[] = [
  { page: 'search', label: 'さがす', title: 'さがす' },
  { page: 'dashboard', label: 'ダッシュボード', title: 'ダッシュボード' },
  { page: 'partner', label: '投稿者ページ', title: '投稿者ページ' },
  { page: 'about', label: '穴場度とは', title: '穴場度とは' },
];

const TOWN_IDS = new Set(TOWNS.map((t) => t.id));
const TAB_IDS = new Set<string>(PARTNER_TABS.map((t) => t.tab));

function validTown(id: string | null): TownId | null {
  return id !== null && TOWN_IDS.has(id) ? id : null;
}

/**
 * URL のハッシュをルートにする（N2-2）。空・未知のページは「さがす」、未知の町は null。
 * 以前の #/report は投稿者ページの「町向けレポート」タブに移す（N2-2・N4-1）
 */
export function parseHash(hash: string): Route {
  const body = hash.replace(/^#/, '').replace(/^\/+/, '');
  const [path, query = ''] = body.split('?', 2);
  const params = new URLSearchParams(query);
  const town = validTown(params.get('town'));
  const tabParam = params.get('tab');
  const tab: PartnerTab = tabParam !== null && TAB_IDS.has(tabParam) ? (tabParam as PartnerTab) : 'post';
  switch (path.replace(/\/+$/, '')) {
    case 'dashboard':
      return { page: 'dashboard' };
    case 'partner':
      return { page: 'partner', town, tab };
    case 'report':
      return { page: 'partner', town, tab: 'report' };
    case 'about':
      return { page: 'about' };
    case 'search':
    default:
      return { page: 'search', town };
  }
}

export function toHash(route: Route): string {
  switch (route.page) {
    case 'search':
      return route.town ? `#/search?town=${encodeURIComponent(route.town)}` : '#/search';
    case 'partner': {
      const q = new URLSearchParams();
      if (route.town) q.set('town', route.town);
      if (route.tab !== 'post') q.set('tab', route.tab);
      const qs = q.toString();
      return qs ? `#/partner?${qs}` : '#/partner';
    }
    default:
      return `#/${route.page}`;
  }
}

/** ページの一番上のリンク先（町やタブを指定しない） */
export function pageHome(page: Page): Route {
  switch (page) {
    case 'search':
      return { page, town: null };
    case 'partner':
      return { page, town: null, tab: 'post' };
    default:
      return { page };
  }
}

export function sameRoute(a: Route, b: Route): boolean {
  return toHash(a) === toHash(b);
}
