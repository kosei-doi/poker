import { TOWNS } from '../data/towns';
import type { TownId } from '../types';

export type Page = 'search' | 'dashboard' | 'report' | 'about';
export type Route =
  | { page: 'search'; town: TownId | null }
  | { page: 'dashboard' }
  | { page: 'report'; town: TownId | null }
  | { page: 'about' };

export const PAGES: { page: Page; label: string; title: string }[] = [
  { page: 'search', label: 'さがす', title: 'さがす' },
  { page: 'dashboard', label: 'ダッシュボード', title: 'ダッシュボード' },
  { page: 'report', label: '町向けレポート', title: '町向けレポート' },
  { page: 'about', label: '穴場度とは', title: '穴場度とは' },
];

const TOWN_IDS = new Set(TOWNS.map((t) => t.id));

function validTown(id: string | null): TownId | null {
  return id !== null && TOWN_IDS.has(id) ? id : null;
}

/** URL のハッシュをルートにする（N2-2）。空・未知のページは「さがす」、未知の町は null */
export function parseHash(hash: string): Route {
  const body = hash.replace(/^#/, '').replace(/^\/+/, '');
  const [path, query = ''] = body.split('?', 2);
  const town = validTown(new URLSearchParams(query).get('town'));
  switch (path.replace(/\/+$/, '')) {
    case 'dashboard':
      return { page: 'dashboard' };
    case 'report':
      return { page: 'report', town };
    case 'about':
      return { page: 'about' };
    case 'search':
    default:
      return { page: 'search', town };
  }
}

export function toHash(route: Route): string {
  if ((route.page === 'search' || route.page === 'report') && route.town) {
    return `#/${route.page}?town=${encodeURIComponent(route.town)}`;
  }
  return `#/${route.page}`;
}

export function sameRoute(a: Route, b: Route): boolean {
  return toHash(a) === toHash(b);
}
