import { describe, expect, it } from 'vitest';
import { parseHash, toHash, type Route } from './route';

describe('parseHash', () => {
  it.each([
    ['#/search', { page: 'search', town: null }],
    ['#/dashboard', { page: 'dashboard' }],
    ['#/report', { page: 'report', town: null }],
    ['#/about', { page: 'about' }],
    ['#/about/', { page: 'about' }],
  ])('%s', (hash, route) => {
    expect(parseHash(hash)).toEqual(route);
  });

  it.each(['', '#', '#/', '#/unknown', '#/search/extra/'])('空・未知のページ「%s」は「さがす」', (hash) => {
    expect(parseHash(hash).page).toBe('search');
  });

  it('?town= は search と report でだけ採り、未知の町は null', () => {
    expect(parseHash('#/search?town=hitachiota')).toEqual({ page: 'search', town: 'hitachiota' });
    expect(parseHash('#/report?town=takahagi')).toEqual({ page: 'report', town: 'takahagi' });
    expect(parseHash('#/search?town=nope')).toEqual({ page: 'search', town: null });
    expect(parseHash('#/dashboard?town=hitachiota')).toEqual({ page: 'dashboard' });
  });
});

describe('toHash', () => {
  it('正規形を作る', () => {
    expect(toHash({ page: 'search', town: null })).toBe('#/search');
    expect(toHash({ page: 'search', town: 'hitachiota' })).toBe('#/search?town=hitachiota');
    expect(toHash({ page: 'report', town: 'daigo' })).toBe('#/report?town=daigo');
    expect(toHash({ page: 'about' })).toBe('#/about');
  });

  it.each<Route>([
    { page: 'search', town: null },
    { page: 'search', town: 'kitaibaraki' },
    { page: 'dashboard' },
    { page: 'report', town: null },
    { page: 'report', town: 'hitachiomiya' },
    { page: 'about' },
  ])('parseHash(toHash(r)) = r: %o', (r) => {
    expect(parseHash(toHash(r))).toEqual(r);
  });
});
