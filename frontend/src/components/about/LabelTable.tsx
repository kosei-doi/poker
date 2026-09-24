import { Tags } from 'lucide-react';

const LABELS = [
  { label: 'ど穴場', rule: '穴場度 3 以上' },
  { label: '穴場', rule: '穴場度 2 以上' },
  { label: 'やや穴場', rule: '穴場度 1 以上' },
];

/** 穴場ラベルのしきい値と、候補から外す条件（N4-2） */
export function LabelTable() {
  return (
    <section aria-labelledby="about-labels" className="space-y-4">
      <h2 id="about-labels" className="flex items-center gap-2 text-lg font-bold">
        <Tags size={18} className="text-glow" aria-hidden />
        ラベルと提案の条件
      </h2>
      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-sm">
          <caption className="sr-only">穴場ラベルのしきい値</caption>
          <thead className="bg-panel-2 text-xs text-muted">
            <tr>
              <th scope="col" className="px-3 py-2 text-left font-normal">ラベル</th>
              <th scope="col" className="px-3 py-2 text-left font-normal">条件（小数第1位に丸めた値）</th>
            </tr>
          </thead>
          <tbody>
            {LABELS.map((l) => (
              <tr key={l.label} className="border-t border-line">
                <th scope="row" className="px-3 py-2 text-left font-bold text-glow">{l.label}</th>
                <td className="px-3 py-2 tabular-nums">{l.rule}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-sm">
          <caption className="sr-only">候補から外す条件</caption>
          <thead className="bg-panel-2 text-xs text-muted">
            <tr>
              <th scope="col" className="px-3 py-2 text-left font-normal">提案しない町</th>
              <th scope="col" className="px-3 py-2 text-left font-normal">理由</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-line">
              <th scope="row" className="px-3 py-2 text-left font-bold tabular-nums">満足度 3.5 未満</th>
              <td className="px-3 py-2 text-muted">知名度が低いだけで、行っても満足しにくい町を出さないため</td>
            </tr>
            <tr className="border-t border-line">
              <th scope="row" className="px-3 py-2 text-left font-bold tabular-nums">穴場度 1 未満</th>
              <td className="px-3 py-2 text-muted">すでに知られていて、穴場とは言えない町を出さないため</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
