import { ChevronRight } from 'lucide-react';
import type { VisitedTownRow } from '../../lib/mypage';
import { toHash } from '../../lib/route';
import type { StatsIndex } from '../../types';
import { ScoreBadge } from '../common/ScoreBadge';

/** 行った町（N3-2）。押すと「さがす」でその町を開く */
export function VisitedTownList({ rows, stats }: { rows: VisitedTownRow[]; stats: StatsIndex }) {
  return (
    <section aria-labelledby="dash-visited" className="space-y-2">
      <h2 id="dash-visited" className="text-base font-extrabold">行った町</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">まだありません</p>
      ) : (
        <ul className="space-y-2">
          {rows.map(({ town, myCount, hole }) => (
            <li key={town.id}>
              <a
                href={toHash({ page: 'search', town: town.id })}
                className="flex items-center gap-2 rounded-xl border border-line bg-panel px-3 py-2.5 hover:border-glow/60 fade-in"
                aria-label={`${town.name}（あなたの声 ${myCount}件）。さがすで開く`}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-bold text-text">
                    {town.name}
                    <span className="ml-2 text-xs font-normal text-muted">あなたの声 {myCount}件</span>
                  </p>
                  {hole !== null ? (
                    <ScoreBadge hole={hole} count={stats.towns[town.id]?.count ?? 0} />
                  ) : (
                    <p className="text-xs text-muted">穴場度はまだありません</p>
                  )}
                </div>
                <ChevronRight size={18} className="text-muted shrink-0" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
