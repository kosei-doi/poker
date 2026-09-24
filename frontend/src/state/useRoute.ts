import { useSyncExternalStore } from 'react';
import { parseHash, toHash, type Route } from '../lib/route';

const ROUTE_EVENT = 'anaba:route';

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  window.addEventListener(ROUTE_EVENT, cb);
  return () => {
    window.removeEventListener('hashchange', cb);
    window.removeEventListener(ROUTE_EVENT, cb);
  };
}

const getHash = () => window.location.hash;

/** 今のルート（N2-2）。ハッシュが変わると再描画する */
export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getHash, () => '');
  return parseHash(hash);
}

/** ページを移る。replace は履歴を増やさない（replaceState は hashchange を出さないので独自イベントで知らせる） */
export function navigate(route: Route, opts: { replace?: boolean } = {}): void {
  const hash = toHash(route);
  if (window.location.hash === hash) return;
  if (opts.replace) {
    history.replaceState(null, '', hash);
    window.dispatchEvent(new Event(ROUTE_EVENT));
  } else {
    window.location.hash = hash;
  }
}

/** 起動時: ハッシュを正規形に直す（空・未知のページ・未知の町） */
export function normalizeHash(): void {
  const canonical = toHash(parseHash(window.location.hash));
  if (window.location.hash !== canonical) {
    history.replaceState(null, '', canonical);
  }
}
