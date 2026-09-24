import { describe, expect, it } from 'vitest';
import { parseHash, toHash, type Route } from './route';

describe('parseHash', () => {
  it.each([
    ['#/search', { page: 'search', town: null }],
    ['#/dashboard', { page: 'dashboard' }],
    ['#/partner', { page: 'partner', town: null, tab: 'post' }],
    ['#/about', { page: 'about' }],
    ['#/about/', { page: 'about' }],
  ])('%s', (hash, route) => {
    expect(parseHash(hash)).toEqual(route);
  });

  it.each(['', '#', '#/', '#/unknown', '#/search/extra/'])('空・未知のページ「%s」は「さがす」', (hash) => {
    expect(parseHash(hash).page).toBe('search');
  });

  it('?town= は search と partner でだけ採り、未知の町は null', () => {
    expect(parseHash('#/search?town=hitachiota')).toEqual({ page: 'search', town: 'hitachiota' });
    expect(parseHash('#/partner?town=takahagi')).toEqual({ page: 'partner', town: 'takahagi', tab: 'post' });
    expect(parseHash('#/search?town=nope')).toEqual({ page: 'search', town: null });
    expect(parseHash('#/dashboard?town=hitachiota')).toEqual({ page: 'dashboard' });
  });

  it('投稿者ページのタブ。未知のタブは「投稿する」', () => {
    expect(parseHash('#/partner?town=daigo&tab=reviews')).toEqual({ page: 'partner', town: 'daigo', tab: 'reviews' });
    expect(parseHash('#/partner?tab=report')).toEqual({ page: 'partner', town: null, tab: 'report' });
    expect(parseHash('#/partner?tab=nope')).toEqual({ page: 'partner', town: null, tab: 'post' });
  });

  it('以前の #/report は投稿者ページの「町向けレポート」タブに移す', () => {
    expect(parseHash('#/report')).toEqual({ page: 'partner', town: null, tab: 'report' });
    expect(parseHash('#/report?town=takahagi')).toEqual({ page: 'partner', town: 'takahagi', tab: 'report' });
    expect(toHash(parseHash('#/report?town=takahagi'))).toBe('#/partner?town=takahagi&tab=report');
  });
});

describe('toHash', () => {
  it('正規形を作る', () => {
    expect(toHash({ page: 'search', town: null })).toBe('#/search');
    expect(toHash({ page: 'search', town: 'hitachiota' })).toBe('#/search?town=hitachiota');
    expect(toHash({ page: 'partner', town: 'daigo', tab: 'post' })).toBe('#/partner?town=daigo');
    expect(toHash({ page: 'partner', town: null, tab: 'reviews' })).toBe('#/partner?tab=reviews');
    expect(toHash({ page: 'about' })).toBe('#/about');
  });

  it.each<Route>([
    { page: 'search', town: null },
    { page: 'search', town: 'kitaibaraki' },
    { page: 'dashboard' },
    { page: 'partner', town: null, tab: 'post' },
    { page: 'partner', town: 'hitachiomiya', tab: 'report' },
    { page: 'partner', town: 'hitachi', tab: 'reviews' },
    { page: 'about' },
  ])('parseHash(toHash(r)) = r: %o', (r) => {
    expect(parseHash(toHash(r))).toEqual(r);
  });
});
