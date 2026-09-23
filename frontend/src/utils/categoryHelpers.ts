import type { EventCategory } from '../types';

export interface CategoryMeta {
  label: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  border: string;
  pinBg: string;
  iconName: string;
}

export const CATEGORY_MAP: Record<EventCategory, CategoryMeta> = {
  marche: {
    label: 'マルシェ・食',
    color: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeText: 'text-emerald-700',
    border: 'border-emerald-300',
    pinBg: '#10b981',
    iconName: 'ShoppingBag'
  },
  festival: {
    label: '祭り・伝統',
    color: 'bg-amber-500',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    badgeText: 'text-amber-800',
    border: 'border-amber-300',
    pinBg: '#f59e0b',
    iconName: 'Sparkles'
  },
  workshop: {
    label: '体験・学び',
    color: 'bg-indigo-500',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    badgeText: 'text-indigo-700',
    border: 'border-indigo-300',
    pinBg: '#6366f1',
    iconName: 'Wrench'
  },
  nature: {
    label: '自然・農業',
    color: 'bg-lime-600',
    badgeBg: 'bg-lime-50 text-lime-800 border-lime-200',
    badgeText: 'text-lime-800',
    border: 'border-lime-300',
    pinBg: '#65a30d',
    iconName: 'Sprout'
  },
  culture: {
    label: 'アート・音楽',
    color: 'bg-rose-500',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    badgeText: 'text-rose-700',
    border: 'border-rose-300',
    pinBg: '#f43f5e',
    iconName: 'Palette'
  },
  volunteer: {
    label: '地域お助け',
    color: 'bg-sky-500',
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
    badgeText: 'text-sky-700',
    border: 'border-sky-300',
    pinBg: '#0ea5e9',
    iconName: 'HandHeart'
  }
};
