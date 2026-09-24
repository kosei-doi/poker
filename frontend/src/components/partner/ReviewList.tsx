import { Building2, FilterX, MessageSquareText, Star } from 'lucide-react';
import { useId, useMemo, useState, type ReactNode } from 'react';
import { KNOWN_LABEL, dateLabel } from '../../lib/format';
import { isPosted } from '../../lib/partner';
import { EMPTY_FILTER, listReviews, reviewSpotOptions, type ReviewFilter } from '../../lib/reviews';
import { useSnapshot } from '../../state/selectors';
import type { Known, Satisfaction, TownId } from '../../types';
import { TagChip } from '../common/TagChip';

const SATISFACTIONS: Satisfaction[] = [1, 2, 3, 4, 5];
const KNOWNS: Known[] = ['known', 'unknown', 'unsure'];

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-xs ${active ? 'border-glow bg-glow text-[#1c1300] font-bold' : 'border-line bg-panel-2'}`}
    >
      {children}
    </button>
  );
}

function toggle<T>(list: T[], value: T, order: readonly T[]): T[] {
  return order.filter((x) => (x === value ? !list.includes(value) : list.includes(x)));
}

/** レビュー（N6-4）: 選んだ町に寄せられた声を新しい順に一覧し、絞り込む */
export function ReviewList({ townId }: { townId: TownId }) {
  const { spots, voices } = useSnapshot();
  const [filter, setFilter] = useState<ReviewFilter>(EMPTY_FILTER);
  const selectId = useId();

  // 町を変えたら絞り込みを解除する（描画中に直して、前の町の絞り込みを一瞬も出さない）
  const [filterTown, setFilterTown] = useState(townId);
  if (filterTown !== townId) {
    setFilterTown(townId);
    setFilter(EMPTY_FILTER);
  }

  const spotOptions = useMemo(() => reviewSpotOptions(townId, spots, voices), [townId, spots, voices]);
  const { rows, total } = useMemo(() => listReviews(townId, spots, voices, filter), [townId, spots, voices, filter]);
  const filtered = filter.spotId !== null || filter.satisfactions.length > 0 || filter.knowns.length > 0;

  return (
    <section className="space-y-3 fade-in" aria-label="レビュー">
      <p className="flex items-center gap-1.5 text-sm" aria-live="polite">
        <MessageSquareText size={16} className="text-glow" aria-hidden />
        <span>
          <b className="text-base text-glow-soft">{rows.length}</b>件
          <span className="text-muted"> / 全{total}件</span>
        </span>
      </p>

      <div className="space-y-2.5 rounded-xl border border-line bg-panel p-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={selectId} className="text-xs text-muted">
            スポット
          </label>
          <select
            id={selectId}
            value={filter.spotId ?? ''}
            onChange={(e) => setFilter((f) => ({ ...f, spotId: e.target.value || null }))}
            className="w-full min-w-0 rounded-lg border border-line bg-panel-2 px-2 py-1.5 text-sm"
          >
            <option value="">すべてのスポット</option>
            {spotOptions.map(({ spot, count }) => (
              <option key={spot.id} value={spot.id}>
                {spot.name}
                {isPosted(spot) ? '（町からの投稿）' : ''}（{count}件）
              </option>
            ))}
          </select>
        </div>

        <fieldset className="space-y-1">
          <legend className="text-xs text-muted">満足度</legend>
          <div className="flex flex-wrap gap-1.5">
            {SATISFACTIONS.map((s) => (
              <Choice
                key={s}
                active={filter.satisfactions.includes(s)}
                onClick={() => setFilter((f) => ({ ...f, satisfactions: toggle(f.satisfactions, s, SATISFACTIONS) }))}
              >
                {s}
              </Choice>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-1">
          <legend className="text-xs text-muted">知っていたか</legend>
          <div className="flex flex-wrap gap-1.5">
            {KNOWNS.map((k) => (
              <Choice
                key={k}
                active={filter.knowns.includes(k)}
                onClick={() => setFilter((f) => ({ ...f, knowns: toggle(f.knowns, k, KNOWNS) }))}
              >
                {KNOWN_LABEL[k]}
              </Choice>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          onClick={() => setFilter(EMPTY_FILTER)}
          disabled={!filtered}
          className="inline-flex items-center gap-1 text-xs text-muted underline-offset-2 hover:underline disabled:opacity-40 disabled:no-underline"
        >
          <FilterX size={14} aria-hidden />
          絞り込みを解除
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-line bg-panel p-4 text-center text-sm text-muted">条件に合う声はありません</p>
      ) : (
        <ol className="space-y-2">
          {rows.map(({ voice, spot }) => (
            <li key={voice.id} className="min-w-0 space-y-1.5 rounded-xl border border-line bg-panel p-3">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="min-w-0 break-words text-sm font-bold">{spot.name}</span>
                {isPosted(spot) && (
                  <span className="inline-flex items-center gap-0.5 rounded-full border border-glow/60 px-1.5 py-0.5 text-[11px] text-glow-soft">
                    <Building2 size={11} aria-hidden />
                    町からの投稿
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap break-words text-sm text-text">{voice.text}</p>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                <span className="inline-flex items-center gap-0.5">
                  <Star size={12} className="text-glow" aria-hidden />
                  満足度 {voice.satisfaction}
                </span>
                <span aria-hidden>・</span>
                <span>{KNOWN_LABEL[voice.known]}</span>
                {voice.tags.map((t) => (
                  <TagChip key={t} tag={t} size="sm" />
                ))}
                <time dateTime={voice.createdAt} className="ml-auto">
                  {dateLabel(voice.createdAt)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
