import { MapPin, Star } from 'lucide-react';
import type { ReactNode } from 'react';
import { quoteText } from '../../lib/candidate';
import { KNOWN_LABEL } from '../../lib/format';
import type { ShowcaseRow } from '../../lib/showcase';
import type { Tag, TownId } from '../../types';
import { ScoreBadge } from '../common/ScoreBadge';

interface Props {
  tag: Tag;
  rows: ShowcaseRow[];
  onSelectTown: (townId: TownId) => void;
  /** 町の写真の差し込み口（無いときは単色の四角） */
  renderTownThumb?: (townId: TownId) => ReactNode;
}

function ThumbPlaceholder() {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#334155]" aria-hidden>
      <MapPin size={20} className="text-muted" />
    </div>
  );
}

/** ダッシュボードのリスト（N7-3・N7-5）: 今のタグを持つ町を穴場度の高い順に並べる */
export function ShowcaseList({ tag, rows, onSelectTown, renderTownThumb }: Props) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-panel p-4 text-center text-sm text-muted fade-in" key={tag}>
        このタグの穴場の町はまだありません
      </p>
    );
  }

  return (
    // タグが変わるたびに作り直してフェードさせる
    <ol key={tag} className="space-y-2">
      {rows.map(({ town, summary, stats, tagCount, evidence, spots }) => (
        <li
          key={town.id}
          onClick={() => onSelectTown(town.id)}
          className="min-w-0 cursor-pointer space-y-2 rounded-xl border border-line bg-panel p-3 fade-in hover:border-glow"
        >
          <div className="flex min-w-0 items-start gap-3">
            <div className="shrink-0">{renderTownThumb ? renderTownThumb(town.id) : <ThumbPlaceholder />}</div>
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="text-base font-extrabold leading-tight">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTown(town.id);
                  }}
                  className="text-left hover:text-glow-soft"
                  aria-label={`さがすで${town.name}を開く`}
                >
                  {town.name}
                </button>
              </h3>
              <p className="break-words text-sm text-text/90">{summary.catchphrase}</p>
            </div>
          </div>

          <ScoreBadge hole={stats.hole} count={stats.count} />

          <p className="text-xs text-muted">
            <span className="font-bold text-glow-soft">#{tag}</span> の声 <b className="text-text tabular-nums">{tagCount}</b>件
          </p>

          {evidence && (
            <div className="space-y-0.5">
              <p className="break-words text-sm text-text">『{quoteText(evidence.evidence)}』</p>
              <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                <span className="inline-flex items-center gap-0.5">
                  <Star size={11} className="text-glow" aria-hidden />
                  満足度 {evidence.satisfaction}
                </span>
                <span aria-hidden>・</span>
                <span>{KNOWN_LABEL[evidence.known]}</span>
              </p>
            </div>
          )}

          {spots.length > 0 && (
            <p className="break-words text-xs text-muted">
              #{tag} のスポット: <span className="text-text">{spots.map((s) => s.spot.name).join('・')}</span>
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
