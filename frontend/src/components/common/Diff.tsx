import { ArrowRight } from 'lucide-react';

interface Props {
  label: string;
  before: number;
  after: number;
  format: (n: number) => string;
  /** 大きくなると良い値か（知名度は下がると穴場） */
  higherIsBetter?: boolean;
  /** 差分の小数桁 */
  digits?: number;
}

/** 「前 → 後」の強調表示（D2-5）。変化が 0.0 でも表示する */
export function Diff({ label, before, after, format, higherIsBetter = true, digits = 1 }: Props) {
  const b = format(before);
  const a = format(after);
  const unit = 10 ** digits;
  const delta = Math.round(after * unit) / unit - Math.round(before * unit) / unit;
  const changed = b !== a;
  const good = changed && (higherIsBetter ? delta > 0 : delta < 0);
  const sign = delta > 0 ? `+${delta.toFixed(digits)}` : delta < 0 ? delta.toFixed(digits) : '±0';
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 border ${
        good ? 'border-glow bg-glow/15 glow-pulse' : 'border-line bg-panel-2/60'
      }`}
    >
      <span className="text-sm text-muted">{label}</span>
      <span className="flex items-center gap-2 tabular-nums">
        <span className="text-muted">{b}</span>
        <ArrowRight size={14} className="text-muted" aria-label="から" />
        <span className={`text-lg font-extrabold ${good ? 'text-glow' : 'text-text'}`}>{a}</span>
        <span className={`text-xs ${good ? 'text-glow-soft' : 'text-muted'}`}>{sign}</span>
      </span>
    </div>
  );
}
