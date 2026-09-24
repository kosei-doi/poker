import { RotateCcw, Sparkles } from 'lucide-react';
import { useReset } from '../state/useReset';

export function Header() {
  const reset = useReset();
  return (
    <header className="flex items-center justify-between gap-3 px-4 h-14 border-b border-line bg-ink/95 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <Sparkles className="text-glow shrink-0" size={22} aria-hidden />
        <div className="min-w-0">
          <h1 className="font-extrabold text-lg leading-none tracking-wide">穴場</h1>
          <p className="text-[11px] text-muted leading-tight truncate">知られていない町に、光を。</p>
        </div>
        <span className="ml-1 shrink-0 rounded border border-glow/50 text-glow-soft text-[11px] px-1.5 py-0.5">サンプルデータ</span>
      </div>
      <button
        type="button"
        onClick={reset}
        className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:text-text hover:border-muted shrink-0"
        title="初期データに戻す"
      >
        <RotateCcw size={15} aria-hidden />
        リセット
      </button>
    </header>
  );
}
