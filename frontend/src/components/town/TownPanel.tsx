import { ArrowLeft, FileText, PenLine } from 'lucide-react';
import { spotsOfTown } from '../../data/spots';
import { townById } from '../../data/towns';
import { minutes, score, yen } from '../../lib/format';
import { buildDayPlan } from '../../lib/plan';
import { isReference } from '../../lib/stats';
import { useApp } from '../../state/context';
import { useSnapshot, useTownView } from '../../state/selectors';
import { useVoiceFlow } from '../../state/useVoiceFlow';
import { TownCard } from '../recommend/TownCard';
import { DayPlan } from './DayPlan';

/** 選んだ町のパネル（D1-2・D2-3・B4・D3 の入口） */
export function TownPanel({ townId }: { townId: string }) {
  const { state, dispatch } = useApp();
  const view = useTownView(townId);
  const snap = useSnapshot();
  const { open } = useVoiceFlow();
  const town = townById(townId);
  if (!town || !view) return null;
  const spots = spotsOfTown(townId);
  const plan = buildDayPlan(town, spots, state.conditions);

  return (
    <section aria-label={`${town.name}の詳細`} className="space-y-4 fade-in">
      <button
        type="button"
        onClick={() => dispatch({ type: 'SELECT_TOWN', townId: null })}
        className="flex items-center gap-1 text-sm text-muted hover:text-text"
      >
        <ArrowLeft size={16} aria-hidden />
        {state.lit.length > 0 ? '提案に戻る' : '戻る'}
      </button>

      <TownCard view={view} famous={state.conditions?.famous ?? null} interactive={false} />

      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-line py-2">
          <dt className="text-[11px] text-muted">満足度</dt>
          <dd className="font-bold tabular-nums">{score(view.stats.satisfaction)}</dd>
        </div>
        <div className="rounded-lg border border-line py-2">
          <dt className="text-[11px] text-muted">知名度</dt>
          <dd className="font-bold tabular-nums">{score(view.stats.fame)}</dd>
        </div>
        <div className="rounded-lg border border-line py-2">
          <dt className="text-[11px] text-muted">東京駅から</dt>
          <dd className="font-bold tabular-nums">片道{minutes(town.oneWayMin)}</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={() => dispatch({ type: 'OPEN_REPORT', townId })}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-glow/60 bg-glow/10 px-3 py-2.5 text-sm font-bold text-glow-soft hover:bg-glow/20"
      >
        <FileText size={16} aria-hidden />
        町向けレポートを開く
      </button>

      <section aria-label="スポット" className="space-y-2">
        <h3 className="text-sm font-bold">スポット</h3>
        <ul className="space-y-2">
          {spots.map((s) => {
            const st = snap.stats.spots[s.id];
            return (
              <li key={s.id} className="rounded-xl border border-line bg-panel-2/60 p-3 space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="grid place-items-center size-6 shrink-0 rounded-full bg-glow text-[#1c1300] text-xs font-extrabold">
                    {s.order}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">
                      {s.name}
                      <span className="ml-2 text-[11px] font-normal text-muted">{s.kind}</span>
                    </p>
                    <p className="text-xs text-muted">{s.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted tabular-nums">
                    穴場度 <span className="font-bold text-glow">{score(st.hole)}</span>・n={st.count}
                    {isReference(st.count) && <span className="ml-1 rounded border border-line px-1">参考値</span>}
                    ・{s.costYen > 0 ? yen(s.costYen) : '無料'}
                  </p>
                  <button
                    type="button"
                    onClick={() => open(s.id)}
                    className="flex items-center gap-1 rounded-lg bg-glow text-[#1c1300] px-2.5 py-1 text-xs font-bold"
                  >
                    <PenLine size={13} aria-hidden />
                    感想を書く
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <DayPlan plan={plan} budgetYen={state.conditions?.budgetYen ?? null} roundTripYen={town.roundTripYen} />
    </section>
  );
}
