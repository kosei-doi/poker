import { MoonStar } from 'lucide-react';
import { townById } from '../../data/towns';
import { useApp } from '../../state/context';

/** 暗くなった町と理由文（D1-3）。暗くなった順に追記する */
export function NarrowingLog() {
  const { state } = useApp();
  if (state.consultPhase === 'idle' || state.consultPhase === 'thinking') return null;
  if (state.narrowingLog.length === 0 && state.consultPhase === 'narrowing') {
    return <p className="text-xs text-muted animate-pulse">町を絞り込んでいます…</p>;
  }
  if (state.narrowingLog.length === 0) return null;
  return (
    <section aria-label="外した町" className="space-y-1.5">
      <h2 className="text-xs font-bold text-muted">条件に合わなかった町</h2>
      <ul className="space-y-1" aria-live="polite">
        {state.narrowingLog.map((e) => (
          <li key={e.townId} className="flex items-center gap-2 text-sm fade-in">
            <MoonStar size={14} className="text-muted shrink-0" aria-hidden />
            <span className="text-muted">{townById(e.townId)?.name}</span>
            <span className="text-text/80">— {e.reason}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
