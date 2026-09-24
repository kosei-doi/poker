import { Heart } from 'lucide-react';
import { townById } from '../../data/towns';
import { useApp } from '../../state/context';
import type { TownId } from '../../types';

/** 「気になる」ボタン（N3-3）。もう一度押すと外れる */
export function FavoriteButton({ townId, size = 'md' }: { townId: TownId; size?: 'sm' | 'md' }) {
  const { state, dispatch } = useApp();
  const on = state.favorites.includes(townId);
  const name = townById(townId)?.name ?? '';
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `${name}を「気になる」から外す` : `${name}を「気になる」に入れる`}
      onClick={(e) => {
        e.stopPropagation();
        dispatch({ type: 'TOGGLE_FAVORITE', townId });
      }}
      onKeyDown={(e) => e.stopPropagation()}
      className={`inline-flex items-center gap-1 rounded-full border shrink-0 ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } ${on ? 'border-glow bg-glow/20 text-glow-soft font-bold' : 'border-line text-muted hover:text-text hover:border-muted'}`}
    >
      <Heart size={size === 'sm' ? 12 : 14} aria-hidden fill={on ? 'currentColor' : 'none'} />
      {on ? '気になる（登録済み）' : '気になる'}
    </button>
  );
}
