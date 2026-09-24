import { AlertTriangle, Footprints } from 'lucide-react';
import { yen } from '../../lib/format';
import type { DayPlan as Plan } from '../../lib/plan';

/** 1日プラン（B4） */
export function DayPlan({ plan, budgetYen, roundTripYen }: { plan: Plan; budgetYen: number | null; roundTripYen: number }) {
  return (
    <section aria-label={plan.title} className="space-y-2">
      <h3 className="text-sm font-bold">{plan.title}</h3>
      <ol className="space-y-0">
        {plan.rows.map((r, i) => (
          <li key={r.spot.id}>
            <div className="flex gap-3 rounded-lg border border-line bg-panel-2/60 px-3 py-2">
              <span className="grid place-items-center size-6 shrink-0 rounded-full bg-glow text-[#1c1300] text-xs font-extrabold">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-bold tabular-nums mr-2">{r.start}</span>
                  {r.spot.name}
                </p>
                <p className="text-xs text-muted">
                  滞在 {r.stayMin}分・費用の目安 {r.costYen > 0 ? yen(r.costYen) : '0円'}
                </p>
              </div>
            </div>
            {r.moveMin > 0 && (
              <p className="flex items-center gap-1.5 pl-5 py-1 text-xs text-muted">
                <Footprints size={12} aria-hidden />
                移動 {r.moveMin}分
              </p>
            )}
          </li>
        ))}
      </ol>
      <div className="rounded-lg border border-line px-3 py-2 text-sm space-y-0.5">
        <p className="flex justify-between">
          <span className="text-muted">往復交通費（東京駅から・目安）</span>
          <span className="tabular-nums">{yen(roundTripYen)}</span>
        </p>
        <p className="flex justify-between font-bold">
          <span>合計（1人・目安）</span>
          <span className="tabular-nums">{yen(plan.totalYen)}</span>
        </p>
      </div>
      {plan.overBudget && budgetYen !== null && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden />
          予算（{yen(budgetYen)}）を{yen(plan.totalYen - budgetYen)}超えます
        </p>
      )}
    </section>
  );
}
