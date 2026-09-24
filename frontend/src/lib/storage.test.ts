import { afterEach, describe, expect, it } from 'vitest';
import { voice } from '../test/fixtures';
import {
  clearFavorites, clearPostedSpots, clearUserVoices, FAVORITES_KEY, loadFavorites, loadPostedSpots, loadUserVoices,
  POSTED_SPOTS_KEY, saveFavorites, savePostedSpots, saveUserVoices, USER_VOICES_KEY,
} from './storage';

class MemoryStorage {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

const g = globalThis as { localStorage?: unknown };
const spotIds = new Set(['s1']);

afterEach(() => {
  delete g.localStorage;
});

describe('storage', () => {
  it('保存して読み戻せる', () => {
    g.localStorage = new MemoryStorage();
    const v = voice('s1', 5, 'unknown', ['竹']);
    expect(saveUserVoices([v])).toBe(true);
    expect(loadUserVoices(spotIds)).toEqual([{ ...v, source: 'user' }]);
    clearUserVoices();
    expect(loadUserVoices(spotIds)).toEqual([]);
  });
  it('壊れた JSON・配列でない値・不正な声を捨てる', () => {
    const m = new MemoryStorage();
    g.localStorage = m;
    m.setItem(USER_VOICES_KEY, '{broken');
    expect(loadUserVoices(spotIds)).toEqual([]);
    m.setItem(USER_VOICES_KEY, '{"a":1}');
    expect(loadUserVoices(spotIds)).toEqual([]);
    const ok = voice('s1', 4);
    const badSpot = voice('nope', 4);
    const badSat = { ...voice('s1', 4), satisfaction: 9 };
    const badTag = { ...voice('s1', 4), tags: ['存在しない'] };
    m.setItem(USER_VOICES_KEY, JSON.stringify([ok, badSpot, badSat, badTag, null, 'x']));
    expect(loadUserVoices(spotIds).map((v) => v.id)).toEqual([ok.id]);
  });
  it('localStorage が例外を投げても落ちない', () => {
    g.localStorage = {
      getItem() {
        throw new Error('denied');
      },
      setItem() {
        throw new Error('quota');
      },
      removeItem() {
        throw new Error('denied');
      },
    };
    expect(loadUserVoices(spotIds)).toEqual([]);
    expect(saveUserVoices([voice('s1', 4)])).toBe(false);
    expect(() => clearUserVoices()).not.toThrow();
  });
  it('localStorage がない環境でも落ちない', () => {
    expect(loadUserVoices(spotIds)).toEqual([]);
    expect(saveUserVoices([])).toBe(false);
  });

  describe('気になる町（N3-3）', () => {
    const townIds = new Set(['hitachiota', 'takahagi', 'hitachi']);
    it('保存して読み戻せる。消すと空', () => {
      g.localStorage = new MemoryStorage();
      expect(saveFavorites(['takahagi', 'hitachiota'])).toBe(true);
      expect(loadFavorites(townIds)).toEqual(['takahagi', 'hitachiota']);
      clearFavorites();
      expect(loadFavorites(townIds)).toEqual([]);
    });
    it('壊れた値・未知の id・重複を捨てる', () => {
      const m = new MemoryStorage();
      g.localStorage = m;
      m.setItem(FAVORITES_KEY, 'broken{');
      expect(loadFavorites(townIds)).toEqual([]);
      m.setItem(FAVORITES_KEY, '"hitachi"');
      expect(loadFavorites(townIds)).toEqual([]);
      m.setItem(FAVORITES_KEY, JSON.stringify(['hitachi', 'nope', 3, 'hitachi', 'takahagi']));
      expect(loadFavorites(townIds)).toEqual(['hitachi', 'takahagi']);
    });
    it('例外を投げる環境・ない環境でも落ちない', () => {
      expect(loadFavorites(townIds)).toEqual([]);
      expect(saveFavorites(['hitachi'])).toBe(false);
      g.localStorage = {
        getItem() {
          throw new Error('denied');
        },
        setItem() {
          throw new Error('quota');
        },
        removeItem() {
          throw new Error('denied');
        },
      };
      expect(loadFavorites(townIds)).toEqual([]);
      expect(saveFavorites(['hitachi'])).toBe(false);
      expect(() => clearFavorites()).not.toThrow();
    });
  });

  describe('町が投稿したスポット（N6-5）', () => {
    const ok = {
      id: 'posted-a1', townId: 'hitachiota', name: '新しい茶屋', kind: '食べる', description: '説明', lat: 36.535,
      lng: 140.515, order: 0, stayMin: 30, moveMin: 0, costYen: 500, posted: true, photoSpotId: 'hitachiota-soba',
      createdAt: '2026-09-24T10:00:00.000Z',
    };
    it('保存して読み戻せる。消すと空', () => {
      g.localStorage = new MemoryStorage();
      expect(savePostedSpots([ok as never])).toBe(true);
      expect(loadPostedSpots()).toEqual([ok]);
      clearPostedSpots();
      expect(loadPostedSpots()).toEqual([]);
    });
    it('境界の外・未知の町・写真の種類違い・id の形・重複・壊れた値を捨てる', () => {
      const m = new MemoryStorage();
      g.localStorage = m;
      m.setItem(POSTED_SPOTS_KEY, '{');
      expect(loadPostedSpots()).toEqual([]);
      const bad = [
        { ...ok, id: 'posted-b1', lat: 36.9, lng: 140.9 },
        { ...ok, id: 'posted-b2', townId: 'hitachiomiya' },
        { ...ok, id: 'posted-b3', photoSpotId: 'hitachiota-bamboo' },
        { ...ok, id: 'x-1' },
        { ...ok, id: 'posted-b4', name: '  ' },
        null,
      ];
      m.setItem(POSTED_SPOTS_KEY, JSON.stringify([ok, ok, ...bad]));
      expect(loadPostedSpots().map((s) => s.id)).toEqual(['posted-a1']);
    });
    it('例外を投げる環境でも落ちない', () => {
      g.localStorage = {
        getItem() {
          throw new Error('denied');
        },
        setItem() {
          throw new Error('quota');
        },
        removeItem() {
          throw new Error('denied');
        },
      };
      expect(loadPostedSpots()).toEqual([]);
      expect(savePostedSpots([])).toBe(false);
      expect(() => clearPostedSpots()).not.toThrow();
    });
  });
});
