import { Calculator } from 'lucide-react';
import type { ReactNode } from 'react';
import { DEMO_SPOT_ID } from '../../data/examples';
import { spotBreakdown } from '../../lib/about';
import { score } from '../../lib/format';
import { isReference } from '../../lib/stats';
import { useSnapshot } from '../../state/selectors';

const f2 = (n: number) => n.toFixed(2);
// 穴場度の丸めを見せる段は3桁にする（2桁だと「1.95 → 1.9」のように丸めと食い違って見えるため）
const f3 = (n: number) => n.toFixed(3);

function Step({ no, title, formula, children }: { no: number; title: string; formula: string; children: ReactNode }) {
  return (
    <li className="rounded-xl border border-line bg-panel-2/60 p-3 space-y-1.5">
      <p className="flex items-start gap-2 text-sm font-bold">
        <span className="grid place-items-center size-5 shrink-0 rounded-full bg-glow text-[#1c1300] text-[11px] font-extrabold">
          {no}
        </span>
        {title}
      </p>
      <p className="text-xs text-muted break-words">{formula}</p>
      <p className="text-sm tabular-nums break-words">{children}</p>
    </li>
  );
}

/** 満足度と知名度の2本の横棒。差が穴場度 */
function HoleBars({ satisfaction, fame, hole }: { satisfaction: number; fame: number; hole: number }) {
  const W = 320;
  const x0 = 64;
  const scale = (v: number) => x0 + (Math.max(0, Math.min(5, v)) / 5) * (W - x0 - 12);
  const xs = scale(satisfaction);
  const xf = scale(fame);
  const lo = Math.min(xs, xf);
  const hi = Math.max(xs, xf);
  return (
    <svg
      viewBox={`0 0 ${W} 128`}
      width="100%"
      role="img"
      aria-label={`満足度 ${score(satisfaction)} と知名度 ${score(fame)} の横棒。差の ${score(hole)} が穴場度`}
      className="block"
    >
      {/* 目盛り 0〜5 */}
      {[0, 1, 2, 3, 4, 5].map((t) => (
        <g key={t}>
          <line x1={scale(t)} x2={scale(t)} y1={8} y2={84} className="stroke-line" strokeWidth={1} />
          <text x={scale(t)} y={98} textAnchor="middle" className="fill-muted" fontSize={10}>
            {t}
          </text>
        </g>
      ))}
      <text x={0} y={30} className="fill-text" fontSize={12}>満足度</text>
      <rect x={x0} y={16} width={xs - x0} height={20} rx={4} className="fill-glow" />
      <text x={xs - 4} y={30} textAnchor="end" className="fill-[#1c1300]" fontSize={11} fontWeight={700}>
        {score(satisfaction)}
      </text>
      <text x={0} y={66} className="fill-text" fontSize={12}>知名度</text>
      <rect x={x0} y={52} width={Math.max(0, xf - x0)} height={20} rx={4} className="fill-muted" />
      {xf - x0 >= 30 ? (
        <text x={xf - 4} y={66} textAnchor="end" className="fill-ink" fontSize={11} fontWeight={700}>
          {score(fame)}
        </text>
      ) : (
        <text x={xf + 4} y={66} className="fill-muted" fontSize={11} fontWeight={700}>
          {score(fame)}
        </text>
      )}
      {/* 差（穴場度） */}
      <rect x={lo} y={40} width={hi - lo} height={8} className="fill-glow/30" />
      <line x1={lo} x2={hi} y1={112} y2={112} className="stroke-glow" strokeWidth={2} />
      <line x1={lo} x2={lo} y1={106} y2={118} className="stroke-glow" strokeWidth={2} />
      <line x1={hi} x2={hi} y1={106} y2={118} className="stroke-glow" strokeWidth={2} />
      <line x1={xf} x2={xf} y1={52} y2={106} className="stroke-glow" strokeWidth={1} strokeDasharray="3 3" />
      <line x1={xs} x2={xs} y1={36} y2={106} className="stroke-glow" strokeWidth={1} strokeDasharray="3 3" />
      <text
        x={Math.min(W - 40, Math.max(x0 + 30, (lo + hi) / 2))}
        y={126}
        textAnchor="middle"
        className="fill-glow"
        fontSize={11}
        fontWeight={700}
      >
        穴場度 {score(hole)}
      </text>
    </svg>
  );
}

/** 5章の式を、デモのスポットの今の値で計算して見せる（N4-2） */
export function FormulaSection() {
  const snap = useSnapshot();
  const spot = snap.spots.find((s) => s.id === DEMO_SPOT_ID);
  if (!spot) return null;
  const mean = snap.stats.mean;
  const b = spotBreakdown(spot.id, snap.voices, mean);
  const st = b.stats;
  const town = snap.towns.find((t) => t.id === spot.townId);
  const townSpots = snap.spots.filter((s) => s.townId === spot.townId).map((s) => ({ s, st: snap.stats.spots[s.id] }));
  const townSt = snap.stats.towns[spot.townId];

  return (
    <section aria-labelledby="about-formula" className="space-y-4">
      <h2 id="about-formula" className="flex items-center gap-2 text-lg font-bold">
        <Calculator size={18} className="text-glow" aria-hidden />
        計算のしかた
      </h2>
      <p className="text-sm text-muted leading-relaxed">
        満足度（1〜5）と「その場所を知っていたか」は、AI が一つひとつの声から読み取ります。
        それを集計して点数にします。例として「{spot.name}」の<strong className="text-text">今の値</strong>
        で計算します（感想を足すとここの数字も変わります）。
      </p>

      <div className="rounded-xl border border-line bg-panel p-3 text-sm tabular-nums">
        <p className="font-bold">
          {spot.name}
          {town && <span className="ml-2 text-xs font-normal text-muted">{town.name}</span>}
        </p>
        <p className="mt-1 text-xs text-muted">
          声 {st.count}件・満足度の合計 {b.sum}・知っていた {b.knownCount}人・知らなかった {b.unknownCount}人・不明{' '}
          {b.unsureCount}人
          {isReference(st.count) && <span className="ml-1 rounded border border-line px-1">参考値</span>}
        </p>
      </div>

      <ol className="space-y-2">
        <Step no={1} title="全体の平均満足度" formula="すべての町・スポットの声の満足度の単純平均">
          {snap.voices.length}件の平均 = <b className="text-glow">{f2(mean)}</b>
        </Step>
        <Step
          no={2}
          title="スポットの満足度（件数による補正つき）"
          formula="(5 × 全体の平均 ＋ 満足度の合計) ÷ (5 ＋ 件数)"
        >
          (5 × {f2(mean)} ＋ {b.sum}) ÷ (5 ＋ {st.count}) = <b className="text-glow">{score(st.satisfaction)}</b>
        </Step>
        <Step
          no={3}
          title="知っていた人の割合"
          formula="(知っていた人数 ＋ 1) ÷ (知っていた・知らなかったの回答数 ＋ 2)。「不明」は数えない"
        >
          ({b.knownCount} ＋ 1) ÷ ({b.answered} ＋ 2) = <b className="text-glow">{f2(st.knownRatio)}</b>
        </Step>
        <Step no={4} title="知名度（0〜5）" formula="5 × 知っていた人の割合">
          5 × {f2(st.knownRatio)} = <b className="text-glow">{score(st.fame)}</b>
        </Step>
        <Step no={5} title="穴場度" formula="満足度 − 知名度（小数第1位まで）">
          {f3(st.satisfaction)} − {f3(st.fame)} = {f3(st.hole)} → <b className="text-glow">{score(st.hole)}</b>
        </Step>
      </ol>
      <p className="text-xs text-muted">途中の値は丸めて表示しています。計算は丸める前の値で行います。</p>

      <div className="rounded-xl border border-line bg-panel p-3">
        <HoleBars satisfaction={st.satisfaction} fame={st.fame} hole={st.hole} />
        <p className="mt-1 text-xs text-muted">満足度の棒と知名度の棒の長さの差が、穴場度です。</p>
      </div>

      {town && (
        <div className="rounded-xl border border-line bg-panel-2/60 p-3 space-y-2 text-sm">
          <p className="font-bold">町の値は、スポットの値を件数で重み付けした平均</p>
          <p className="text-xs text-muted">町の穴場度 = Σ(スポットの穴場度 × 件数) ÷ Σ件数（満足度・知名度も同じ）</p>
          <ul className="text-xs tabular-nums space-y-0.5">
            {townSpots.map(({ s, st: x }) => (
              <li key={s.id}>
                {s.name}: 穴場度 {score(x.hole)} × {x.count}件
              </li>
            ))}
          </ul>
          <p className="tabular-nums">
            {town.name}の穴場度 ={' '}
            <b className="text-glow">{townSt ? score(townSt.hole) : '—'}</b>
            {townSt && <span className="ml-1 text-xs text-muted">（{townSt.count}件）</span>}
          </p>
        </div>
      )}
    </section>
  );
}
