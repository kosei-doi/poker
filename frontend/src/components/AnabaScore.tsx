import React from 'react';
import { anabaScore, anabaLabel } from '../lib/anaba';
import type { Region } from '../types';

/** 知名度と満足度の差を、そのまま棒で見せる。数字の出どころが画面で分かるようにする。 */
export const AnabaScore: React.FC<{ region: Region; detailed?: boolean }> = ({ region, detailed }) => {
  const s = anabaScore(region);
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-[#0E1013]">
          {anabaLabel(s)}
        </span>
        <span className="text-[11px] text-stone-400">穴場度 {s.toFixed(1)}</span>
      </div>

      {detailed && (
        <div className="mt-3 space-y-1.5">
          <Bar label="知名度" value={region.fame} tone="bg-stone-600" hint="低いほど知られていない" />
          <Bar label="満足度" value={region.satisfaction} tone="bg-amber-400" hint="行った人の評価" />
          <p className="text-[10px] text-stone-500 pt-1">
            穴場度 = 満足度 {region.satisfaction} − 知名度 {region.fame} = <b className="text-stone-300">{s.toFixed(1)}</b>
          </p>
        </div>
      )}
    </div>
  );
};

const Bar: React.FC<{ label: string; value: number; tone: string; hint: string }> = ({ label, value, tone, hint }) => (
  <div className="flex items-center gap-2">
    <span className="text-[10px] text-stone-400 w-10 shrink-0">{label}</span>
    <span className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
      <span className={`block h-full ${tone}`} style={{ width: `${(value / 5) * 100}%` }} />
    </span>
    <span className="text-[10px] text-stone-500 w-24 shrink-0 text-right">{hint}</span>
  </div>
);
