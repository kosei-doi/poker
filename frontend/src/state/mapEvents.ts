/**
 * 「県北へのズームが終わった」の通知（N1-2、設計 13.7.4）。
 * 相談を送ったとき、進行役（useConsultFlow）はズームの完了を待ってから絞り込みの時刻表を始める。
 * 地図（SpotlightMap）は、自分が今どちらを表示しているかをここに知らせる。
 * React の state ではなくモジュールの変数にしているのは、地図の moveend と進行役の await を
 * レンダリングを挟まずにつなぐため。
 */

/** 通知が来なくてもこの時間で待つのをやめる（地図の不具合で相談が止まらないように） */
export const KENPOKU_READY_TIMEOUT_MS = 3000;

let mounted = false;
/** 県北へのズームが終わり、県北を表示している */
let kenpokuShown = false;
/** 県北へのズームの途中 */
let zooming = false;
const waiters = new Set<() => void>();

function flush() {
  const list = [...waiters];
  waiters.clear();
  for (const resolve of list) resolve();
}

/** 地図ができた・消えた。消えたら待っている相談は先へ進める */
export function setMapMounted(value: boolean): void {
  mounted = value;
  if (!value) {
    kenpokuShown = false;
    zooming = false;
    flush();
  }
}

/** 県北へのズームを始める（true）・やめる（false） */
export function setKenpokuZooming(value: boolean): void {
  zooming = value;
  if (value) kenpokuShown = false;
}

/** 日本全体の表示に移った */
export function markJapanShown(): void {
  kenpokuShown = false;
  zooming = false;
}

/** 県北へのズームが終わった（アニメーションなしで県北を表示したときも呼ぶ） */
export function notifyKenpokuReady(): void {
  zooming = false;
  kenpokuShown = true;
  flush();
}

/** 今すぐ絞り込みを始めてよいか（地図がない、または県北を表示していてズームの途中でない） */
export function isKenpokuReady(): boolean {
  return !mounted || (kenpokuShown && !zooming);
}

/**
 * 県北の表示が整うまで待つ。すぐ始めてよいときは即解決し、そうでなければ
 * notifyKenpokuReady か、地図が消えるか、3秒たつまで待つ。abort されたら AbortError で reject する
 */
export function waitKenpokuReady(signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'));
  if (isKenpokuReady()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const done = () => {
      clearTimeout(timer);
      waiters.delete(done);
      signal?.removeEventListener('abort', onAbort);
      resolve();
    };
    const onAbort = () => {
      clearTimeout(timer);
      waiters.delete(done);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    const timer = setTimeout(done, KENPOKU_READY_TIMEOUT_MS);
    waiters.add(done);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** テスト用: 初期状態に戻す */
export function resetMapEvents(): void {
  mounted = false;
  kenpokuShown = false;
  zooming = false;
  waiters.clear();
}
