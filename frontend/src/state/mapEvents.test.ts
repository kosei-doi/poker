import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  KENPOKU_READY_TIMEOUT_MS,
  markJapanShown,
  notifyKenpokuReady,
  resetMapEvents,
  setKenpokuZooming,
  setMapMounted,
  waitKenpokuReady,
} from './mapEvents';

/** Promise が解決したか（reject は 'rejected'）をマイクロタスクを流してから見る */
async function status(p: Promise<void>): Promise<'pending' | 'resolved' | 'rejected'> {
  let s: 'pending' | 'resolved' | 'rejected' = 'pending';
  p.then(
    () => (s = 'resolved'),
    () => (s = 'rejected'),
  );
  await Promise.resolve();
  await Promise.resolve();
  return s;
}

beforeEach(() => {
  vi.useFakeTimers();
  resetMapEvents();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('waitKenpokuReady', () => {
  it('地図がマウントされていなければ即解決する', async () => {
    expect(await status(waitKenpokuReady())).toBe('resolved');
  });

  it('日本全体を表示中なら、通知で解決する', async () => {
    setMapMounted(true);
    const p = waitKenpokuReady();
    expect(await status(p)).toBe('pending');
    setKenpokuZooming(true);
    vi.advanceTimersByTime(1000);
    expect(await status(p)).toBe('pending');
    notifyKenpokuReady();
    expect(await status(p)).toBe('resolved');
  });

  it('県北を表示していてズーム中でなければ即解決する', async () => {
    setMapMounted(true);
    notifyKenpokuReady();
    expect(await status(waitKenpokuReady())).toBe('resolved');
  });

  it('県北へのズームの途中なら、通知まで待つ', async () => {
    setMapMounted(true);
    notifyKenpokuReady();
    setKenpokuZooming(true);
    const p = waitKenpokuReady();
    expect(await status(p)).toBe('pending');
    notifyKenpokuReady();
    expect(await status(p)).toBe('resolved');
  });

  it('日本全体に戻ったら、また待つ', async () => {
    setMapMounted(true);
    notifyKenpokuReady();
    markJapanShown();
    expect(await status(waitKenpokuReady())).toBe('pending');
  });

  it('通知がなくても3秒で解決する', async () => {
    setMapMounted(true);
    const p = waitKenpokuReady();
    vi.advanceTimersByTime(KENPOKU_READY_TIMEOUT_MS - 1);
    expect(await status(p)).toBe('pending');
    vi.advanceTimersByTime(1);
    expect(await status(p)).toBe('resolved');
    expect(KENPOKU_READY_TIMEOUT_MS).toBe(3000);
  });

  it('地図が消えたら解決する', async () => {
    setMapMounted(true);
    const p = waitKenpokuReady();
    setMapMounted(false);
    expect(await status(p)).toBe('resolved');
  });

  it('abort で止まる（AbortError）。あとの通知で解決しない', async () => {
    setMapMounted(true);
    const ctrl = new AbortController();
    const p = waitKenpokuReady(ctrl.signal);
    ctrl.abort();
    await expect(p).rejects.toMatchObject({ name: 'AbortError' });
    notifyKenpokuReady();
    vi.advanceTimersByTime(KENPOKU_READY_TIMEOUT_MS);
  });

  it('abort 済みの signal なら即 reject する', async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(waitKenpokuReady(ctrl.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('待っている相談が複数でも、1回の通知ですべて解決する', async () => {
    setMapMounted(true);
    const a = waitKenpokuReady();
    const b = waitKenpokuReady();
    notifyKenpokuReady();
    expect(await status(a)).toBe('resolved');
    expect(await status(b)).toBe('resolved');
  });
});
