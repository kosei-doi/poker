import type { SpotCategory } from '../types';

export interface CategoryMeta {
  label: string;
  emoji: string;
  badgeBg: string;
  pinBg: string;
}

export const CATEGORY_MAP: Record<SpotCategory, CategoryMeta> = {
  gourmet: {
    label: '食・カフェ',
    emoji: '🍵',
    badgeBg: 'bg-orange-50 text-orange-800 border-orange-200',
    pinBg: '#ea580c',
  },
  nature: {
    label: '自然・散策',
    emoji: '🌲',
    badgeBg: 'bg-lime-50 text-lime-800 border-lime-200',
    pinBg: '#65a30d',
  },
  view: {
    label: '絶景',
    emoji: '🌅',
    badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
    pinBg: '#0284c7',
  },
  onsen: {
    label: '温泉・銭湯',
    emoji: '♨️',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    pinBg: '#e11d48',
  },
  craft: {
    label: '手仕事・体験',
    emoji: '🪵',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    pinBg: '#4f46e5',
  },
  history: {
    label: '歴史・町並み',
    emoji: '⛩️',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    pinBg: '#b45309',
  },
};

export const CATEGORY_KEYS = Object.keys(CATEGORY_MAP) as SpotCategory[];

/** 足跡マップの色（旅人 / 地元） */
export const FOOTPRINT_COLORS = {
  visitor: '#f59e0b',
  local: '#059669',
} as const;
