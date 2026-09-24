import type { Tag } from '../../types';

interface Props {
  tag: Tag;
  count?: number;
  highlight?: 'new' | 'up' | 'match' | null;
  size?: 'sm' | 'md';
}

/** 特徴のタグ（D5-2）。count はそのタグの元になった声の件数 */
export function TagChip({ tag, count, highlight = null, size = 'md' }: Props) {
  const base = size === 'sm' ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';
  const tone =
    highlight === 'new' || highlight === 'up'
      ? 'bg-glow text-[#1c1300] border-glow glow-pulse font-bold'
      : highlight === 'match'
        ? 'bg-glow/15 text-glow-soft border-glow/60'
        : 'bg-panel-2 text-text border-line';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${base} ${tone}`}>
      #{tag}
      {count !== undefined && <span className="opacity-80">{count}</span>}
      {highlight === 'new' && <span className="text-[10px] font-extrabold">NEW</span>}
    </span>
  );
}
