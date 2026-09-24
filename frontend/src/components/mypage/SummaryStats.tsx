import type { MyPageSummary } from '../../lib/mypage';

/** まとめの数字（N3-4）。点数・順位・称号は出さない */
export function SummaryStats({ summary }: { summary: MyPageSummary }) {
  const items = [
    { label: '書いた声', value: summary.voices, unit: '件' },
    { label: '行った町', value: summary.towns, unit: '町' },
    { label: '気になる町', value: summary.favorites, unit: '町' },
  ];
  return (
    <dl className="grid grid-cols-3 gap-2 sm:gap-3 text-center" aria-label="まとめの数字">
      {items.map((it) => (
        <div key={it.label} className="rounded-xl border border-line bg-panel py-3">
          <dt className="text-xs text-muted">{it.label}</dt>
          <dd className="mt-1 text-2xl font-extrabold tabular-nums text-text">
            {it.value}
            <span className="ml-0.5 text-xs font-normal text-muted">{it.unit}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
