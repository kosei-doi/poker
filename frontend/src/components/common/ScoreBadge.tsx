import { holeLabel, isReference } from '../../lib/stats';
import { score } from '../../lib/format';

interface Props {
  hole: number;
  count: number;
  size?: 'sm' | 'lg';
}

/** 穴場度＋穴場ラベル＋件数＋参考値（D2-3・B3） */
export function ScoreBadge({ hole, count, size = 'sm' }: Props) {
  const label = holeLabel(hole);
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="text-muted text-xs">穴場度</span>
      <span className={`font-extrabold text-glow tabular-nums ${size === 'lg' ? 'text-3xl' : 'text-xl'}`}>{score(hole)}</span>
      {label && (
        <span className="rounded-md bg-glow/15 border border-glow/50 text-glow-soft text-xs font-bold px-1.5 py-0.5">{label}</span>
      )}
      <span className="text-muted text-xs tabular-nums">n={count}</span>
      {isReference(count) && (
        <span className="rounded border border-line text-muted text-[11px] px-1">参考値</span>
      )}
    </div>
  );
}
