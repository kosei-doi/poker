import { Lightbulb } from 'lucide-react';
import { useApp } from '../../state/context';
import { useCandidateViews } from '../../state/selectors';
import { useConsultFlow } from '../../state/useConsultFlow';
import { TownCard } from './TownCard';

/** 穴場の町の提案（B3）と 0件のときのヒント */
export function RecommendationList() {
  const { state, dispatch } = useApp();
  const views = useCandidateViews();
  const { rerun } = useConsultFlow();

  if (state.showEmpty && state.recommendation && state.conditions) {
    const conditions = state.conditions;
    return (
      <section aria-label="見つからなかったとき" className="rounded-xl border border-line bg-panel-2/60 p-3 space-y-2 fade-in">
        <p className="font-bold text-sm">条件に合う穴場の町がありませんでした</p>
        <p className="text-xs text-muted">次のように緩めると見つかります。</p>
        <ul className="space-y-1.5">
          {state.recommendation.relaxHints.map((h) => (
            <li key={h.label}>
              {h.patch ? (
                <button
                  type="button"
                  onClick={() => void rerun({ ...conditions, ...h.patch })}
                  className="w-full flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-sm text-left hover:border-glow/70"
                >
                  <Lightbulb size={15} className="text-glow shrink-0" aria-hidden />
                  <span className="flex-1">{h.label}</span>
                  <span className="text-xs text-muted">{h.townCount}町</span>
                </button>
              ) : (
                <p className="flex items-center gap-2 px-3 py-2 text-sm">
                  <Lightbulb size={15} className="text-glow shrink-0" aria-hidden />
                  {h.label}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (state.lit.length === 0 || views.length === 0) return null;
  return (
    <section aria-label="穴場の町の提案" className="space-y-3">
      <h2 className="text-xs font-bold text-muted">光が当たった穴場の町</h2>
      {views.map((v, i) => (
        <TownCard
          key={v.townId}
          view={v}
          rank={i + 1}
          famous={state.conditions?.famous ?? null}
          onOpen={() => dispatch({ type: 'SELECT_TOWN', townId: v.townId })}
        />
      ))}
    </section>
  );
}
