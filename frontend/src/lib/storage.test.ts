import { afterEach, describe, expect, it } from 'vitest';
import { voice } from '../test/fixtures';
import {
  clearFavorites, clearUserVoices, FAVORITES_KEY, loadFavorites, loadUserVoices, saveFavorites, saveUserVoices,
  USER_VOICES_KEY,
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
});
