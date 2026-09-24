import { TAGS, type SpotId, type TownId, type Voice } from '../types';

export const USER_VOICES_KEY = 'anaba-poc/v1/userVoices';
export const FAVORITES_KEY = 'anaba-poc/v1/favorites';

function getStorage(): Storage | null {
  try {
    return typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage;
  } catch {
    return null;
  }
}

const TAG_SET = new Set<string>(TAGS);

function isVoice(v: unknown, spotIds: Set<SpotId>): v is Voice {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.spotId === 'string' &&
    spotIds.has(o.spotId) &&
    typeof o.text === 'string' &&
    typeof o.satisfaction === 'number' &&
    [1, 2, 3, 4, 5].includes(o.satisfaction) &&
    (o.known === 'known' || o.known === 'unknown' || o.known === 'unsure') &&
    Array.isArray(o.tags) &&
    o.tags.every((t) => typeof t === 'string' && TAG_SET.has(t)) &&
    typeof o.evidence === 'string' &&
    typeof o.createdAt === 'string' &&
    !Number.isNaN(Date.parse(o.createdAt))
  );
}

/** 利用者の声を読む。壊れたデータ・不正な声は捨てる。保存できない環境では空配列 */
export function loadUserVoices(spotIds: Set<SpotId>): Voice[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(USER_VOICES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v) => isVoice(v, spotIds)).map((v) => ({ ...v, source: 'user' as const }));
  } catch {
    return [];
  }
}

export function saveUserVoices(voices: Voice[]): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(USER_VOICES_KEY, JSON.stringify(voices));
    return true;
  } catch {
    return false;
  }
}

export function clearUserVoices(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(USER_VOICES_KEY);
  } catch {
    // 保存できない環境では何もしない
  }
}

/** 気になる町を読む（N3-3）。未知の id・重複・壊れた値は捨てる。保存できない環境では空配列 */
export function loadFavorites(townIds: Set<TownId>): TownId[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: TownId[] = [];
    for (const id of parsed) {
      if (typeof id === 'string' && townIds.has(id) && !out.includes(id)) out.push(id);
    }
    return out;
  } catch {
    return [];
  }
}

export function saveFavorites(favorites: TownId[]): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return true;
  } catch {
    return false;
  }
}

export function clearFavorites(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(FAVORITES_KEY);
  } catch {
    // 保存できない環境では何もしない
  }
}
