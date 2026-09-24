import type { Known, Tag } from '../types';

export const yen = (n: number) => `${Math.round(n).toLocaleString('ja-JP')}円`;
export const minutes = (n: number) => `${n}分`;
/** 点数は小数第1位まで（設計 決定#1） */
export const score = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
export const hashTag = (t: Tag) => `#${t}`;
export const hashTags = (tags: Tag[]) => tags.map(hashTag).join(' ');

/** 予算の表示（「1万円」「5,000円」「1.5万円」） */
export function budgetLabel(n: number): string {
  if (n >= 10000 && n % 1000 === 0) {
    const man = n / 10000;
    return `${Number.isInteger(man) ? man : man.toFixed(1)}万円`;
  }
  return yen(n);
}

export const KNOWN_LABEL: Record<Known, string> = {
  known: '知っていた',
  unknown: '知らなかった',
  unsure: '不明',
};

export function dateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}
