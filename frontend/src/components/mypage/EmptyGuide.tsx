import { Search } from 'lucide-react';
import { toHash } from '../../lib/route';

/** 声も気になる町もないときの案内（N3-5） */
export function EmptyGuide() {
  return (
    <div className="rounded-xl border border-line bg-panel px-4 py-5 text-sm space-y-3 fade-in">
      <p className="text-text">
        まだ記録がありません。『さがす』で町を選び、感想を書くか『気になる』を押すとここに並びます
      </p>
      <a
        href={toHash({ page: 'search', town: null })}
        className="inline-flex items-center gap-1 rounded-full bg-glow text-[#1c1300] font-bold px-3 py-1.5 hover:opacity-90"
      >
        <Search size={14} aria-hidden />
        さがす
      </a>
    </div>
  );
}
