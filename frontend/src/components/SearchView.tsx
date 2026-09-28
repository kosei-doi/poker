import React from 'react';
import { Car, Wallet, Clock, Users, ChevronRight } from 'lucide-react';
import type { Region, Filters } from '../types';
import { filterRegions, VIBES, WHOM, fmtDuration } from '../lib/anaba';
import { AnabaScore } from './AnabaScore';

interface Props {
  regions: Region[];
  filters: Filters;
  onFilters: (f: Filters) => void;
  onOpen: (r: Region) => void;
}

const Chip: React.FC<{ on: boolean; onClick: () => void; children: React.ReactNode }> = ({ on, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
      on ? 'bg-amber-400 border-amber-400 text-[#0E1013]' : 'border-white/15 text-stone-400 hover:text-stone-100 hover:border-white/30'
    }`}
  >
    {children}
  </button>
);

export const SearchView: React.FC<Props> = ({ regions, filters, onFilters, onOpen }) => {
  const list = filterRegions(regions, filters);
  const set = (p: Partial<Filters>) => onFilters({ ...filters, ...p });

  return (
    <div>
      {/* 主張 */}
      <section className="mb-7">
        <p className="text-[11px] font-bold tracking-[0.14em] text-amber-400 mb-2">
          行き先を決める係になってしまった人へ
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold leading-[1.15] tracking-tight mb-3">
          穴場なのに、<br className="sm:hidden" />失敗しない。
        </h1>
        <p className="text-sm text-stone-400 leading-relaxed max-w-xl">
          「どこ行く？」で全員が黙る。結局あなたが調べて、候補を出して、説得して、計画を組む。
          外したら自分のせいになる。
          有名じゃない町を選べないのは情報がないからではなく、
          <span className="text-stone-200 font-semibold">決めきる根拠がない</span>からです。
        </p>
      </section>

      {/* 条件 */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 mb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-stone-400 mb-2">
              <Clock className="w-3.5 h-3.5" /> 片道 {fmtDuration(filters.maxMinutes)} 以内
            </label>
            <input type="range" min={30} max={240} step={10} value={filters.maxMinutes}
              onChange={(e) => set({ maxMinutes: +e.target.value })}
              className="w-full accent-amber-400" />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-stone-400 mb-2">
              <Wallet className="w-3.5 h-3.5" /> 1人 {filters.maxBudget.toLocaleString()}円まで
            </label>
            <input type="range" min={2000} max={15000} step={500} value={filters.maxBudget}
              onChange={(e) => set({ maxBudget: +e.target.value })}
              className="w-full accent-amber-400" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-bold text-stone-500 mr-1">
            <Users className="w-3.5 h-3.5" /> 誰と
          </span>
          <Chip on={filters.withWhom === 'any'} onClick={() => set({ withWhom: 'any' })}>指定なし</Chip>
          {WHOM.map((w) => (
            <Chip key={w.key} on={filters.withWhom === w.key} onClick={() => set({ withWhom: w.key })}>{w.label}</Chip>
          ))}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-stone-500 mr-1">気分</span>
          <Chip on={filters.vibe === 'any'} onClick={() => set({ vibe: 'any' })}>指定なし</Chip>
          {VIBES.map((v) => (
            <Chip key={v.key} on={filters.vibe === v.key} onClick={() => set({ vibe: v.key })}>{v.label}</Chip>
          ))}
        </div>
      </section>

      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-bold">穴場度の高い順 · {list.length}件</h2>
        <span className="text-[11px] text-stone-500">記事ではなく計算で並べています</span>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-stone-500 border border-white/10 rounded-2xl p-6 text-center">
          条件に合う町がありません。時間か予算をゆるめてみてください。
        </p>
      ) : (
        <div className="grid gap-3">
          {list.map((r) => (
            <button key={r.id} onClick={() => onOpen(r)}
              className="group text-left flex gap-4 p-3 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-amber-400/40 hover:bg-white/[0.05] transition">
              <img src={r.image} alt="" className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover shrink-0 bg-white/5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-lg leading-tight">{r.name}</h3>
                    <p className="text-[11px] text-stone-500">{r.pref}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-600 group-hover:text-amber-400 shrink-0 mt-1" />
                </div>
                <p className="text-sm text-stone-300 mt-1.5 leading-snug">{r.catch}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-500">
                  <span className="inline-flex items-center gap-1"><Car className="w-3.5 h-3.5" />{r.access.mode}・{r.access.from}から{fmtDuration(r.access.minutes)}</span>
                  <span className="inline-flex items-center gap-1"><Wallet className="w-3.5 h-3.5" />{r.budget.toLocaleString()}円</span>
                  <span>{r.voices.length}人が行った</span>
                </div>
                <div className="mt-2"><AnabaScore region={r} /></div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
