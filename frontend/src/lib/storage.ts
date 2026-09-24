import { TAGS, type SpotId, type Voice } from '../types';

export const USER_VOICES_KEY = 'anaba-poc/v1/userVoices';

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
