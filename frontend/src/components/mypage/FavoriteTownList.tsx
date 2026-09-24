import { ChevronRight } from 'lucide-react';
import { townById } from '../../data/towns';
import { toHash } from '../../lib/route';
import type { StatsIndex, TownId, TownSummary } from '../../types';
import { FavoriteButton } from '../common/FavoriteButton';
import { ScoreBadge } from '../common/ScoreBadge';

interface Props {
  favorites: TownId[];
  stats: StatsIndex;
  summaries: Record<TownId, TownSummary>;
}

/** 気になる町（N3-3）。「気になる」を外すと一覧から消える */
export function FavoriteTownList({ favorites, stats, summaries }: Props) {
  const towns = favorites.map((id) => townById(id)).filter((t) => t !== undefined);
  return (
    <section aria-labelledby="dash-favorites" className="space-y-2">
      <h2 id="dash-favorites" className="text-base font-extrabold">気になる町</h2>
      {towns.length === 0 ? (
        <p className="text-sm text-muted">まだありません</p>
      ) : (
        <ul className="space-y-2">
          {towns.map((town) => {
            const st = stats.towns[town.id];
            const catchphrase = summaries[town.id]?.catchphrase;
            return (
              <li key={town.id} className="rounded-xl border border-line bg-panel px-3 py-2.5 space-y-1.5 fade-in">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-text">{town.name}</p>
                    {catchphrase && <p className="text-sm text-text/90">{catchphrase}</p>}
                  </div>
                  <FavoriteButton townId={town.id} size="sm" />
                </div>
                {st ? (
                  <ScoreBadge hole={st.hole} count={st.count} />
                ) : (
                  <p className="text-xs text-muted">まだ声がありません</p>
                )}
                <a
                  href={toHash({ page: 'search', town: town.id })}
                  className="inline-flex items-center gap-0.5 text-sm text-glow-soft hover:underline"
                  aria-label={`さがすで${town.name}を開く`}
                >
                  さがすで開く
                  <ChevronRight size={14} aria-hidden />
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
