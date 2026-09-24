import { TrendingDown } from 'lucide-react';
import { correctionSeries } from '../../lib/about';
import { score } from '../../lib/format';
import { useSnapshot } from '../../state/selectors';

const W = 360;
const H = 230;
const PAD = { l: 40, r: 16, t: 20, b: 44 };

/** 件数による補正（ベイズ平均）の折れ線（N4-2） */
export function CorrectionChart() {
  const { stats } = useSnapshot();
  const mean = stats.mean;
  const points = correctionSeries(mean);
  // 縦軸は全体の平均の少し下から 5 まで
  const yMin = Math.max(1, Math.floor(mean * 2) / 2 - 0.5);
  const yMax = 5;
  const x = (i: number) => PAD.l + (i / (points.length - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + ((yMax - v) / (yMax - yMin)) * (H - PAD.t - PAD.b);
  const ticks: number[] = [];
  for (let t = yMin; t <= yMax + 1e-9; t += 0.5) ticks.push(t);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.satisfaction)}`).join(' ');
  const label = `満足度5の声だけが n 件あるスポットの補正後の満足度。${points
    .map((p) => `${p.n}件で${score(p.satisfaction)}`)
    .join('、')}。全体の平均は${score(mean)}`;

  return (
    <section aria-labelledby="about-correction" className="space-y-4">
      <h2 id="about-correction" className="flex items-center gap-2 text-lg font-bold">
        <TrendingDown size={18} className="text-glow" aria-hidden />
        件数が少ないときの補正
      </h2>
      <p className="text-sm text-muted leading-relaxed">
        声が1件だけで満足度5なら、そのまま5点にすると点数が大きくぶれます。そこで、どのスポットにも
        「全体の平均満足度の声が5件ある」とみなして足し合わせます（ベイズ平均）。声が少ないうちは全体の平均に寄り、
        声が増えるほど本来の値に近づきます。知名度も同じ考え方で、回答が少ないうちは真ん中（2.5）に寄せています。
      </p>

      <figure className="rounded-xl border border-line bg-panel p-3">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} className="block">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className="stroke-line" strokeWidth={1} />
              <text x={PAD.l - 6} y={y(t) + 3} textAnchor="end" className="fill-muted" fontSize={10}>
                {t.toFixed(1)}
              </text>
            </g>
          ))}
          {/* 全体の平均の横線（グレー） */}
          <line
            x1={PAD.l}
            x2={W - PAD.r}
            y1={y(mean)}
            y2={y(mean)}
            className="stroke-muted"
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
          <text x={W - PAD.r} y={y(mean) + 13} textAnchor="end" className="fill-muted" fontSize={10}>
            全体の平均 {score(mean)}
          </text>
          <path d={path} fill="none" className="stroke-glow" strokeWidth={2} />
          {points.map((p, i) => (
            <g key={p.n}>
              <circle
                cx={x(i)}
                cy={y(p.satisfaction)}
                r={4.5}
                strokeWidth={2}
                className={p.reference ? 'stroke-glow fill-panel' : 'stroke-glow fill-glow'}
              />
              <text x={x(i)} y={y(p.satisfaction) - 9} textAnchor="middle" className="fill-glow-soft" fontSize={10}>
                {score(p.satisfaction)}
              </text>
              <text x={x(i)} y={H - PAD.b + 16} textAnchor="middle" className="fill-muted" fontSize={10}>
                {p.n}
              </text>
            </g>
          ))}
          <text x={(PAD.l + W - PAD.r) / 2} y={H - 8} textAnchor="middle" className="fill-muted" fontSize={10}>
            声の件数 n（すべて満足度5）
          </text>
          <text
            x={12}
            y={(PAD.t + H - PAD.b) / 2}
            textAnchor="middle"
            className="fill-muted"
            fontSize={10}
            transform={`rotate(-90 12 ${(PAD.t + H - PAD.b) / 2})`}
          >
            補正後の満足度
          </text>
        </svg>
        <figcaption className="mt-2 text-xs text-muted leading-relaxed">
          白抜きの点は5件未満です。5件未満のスポット・町の点数は、画面で「参考値」と表示します。
        </figcaption>
      </figure>
    </section>
  );
}
