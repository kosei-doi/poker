import React from 'react';
import { X, Car, Wallet, CalendarDays, Sparkles, Footprints } from 'lucide-react';
import type { Region } from '../types';
import { fmtDuration, KIND_LABEL } from '../lib/anaba';
import { AnabaScore } from './AnabaScore';

interface Props {
  region: Region | null;
  onClose: () => void;
  onPlan: (id: string) => void;
  onTraces: (id: string) => void;
}

export const RegionSheet: React.FC<Props> = ({ region, onClose, onPlan, onTraces }) => {
  if (!region) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[88vh] overflow-y-auto bg-[#14171B] border border-white/10 rounded-t-3xl sm:rounded-3xl">
        <img src={region.image} alt="" className="w-full h-44 object-cover" />
        <button onClick={onClose}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 grid place-items-center hover:bg-black/80">
          <X className="w-4 h-4" />
        </button>

        <div className="p-5">
          <h2 className="text-2xl font-extrabold">{region.name}</h2>
          <p className="text-[11px] text-stone-500 mb-2">{region.pref}</p>
          <p className="text-sm text-stone-300 leading-relaxed mb-4">{region.catch}</p>

          <div className="rounded-xl border border-white/10 p-3.5 mb-4">
            <AnabaScore region={region} detailed />
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <Fact icon={Car} label="行き方" v={`${region.access.mode}`} sub={`${region.access.from}から${fmtDuration(region.access.minutes)}`} />
            <Fact icon={Wallet} label="予算" v={`${region.budget.toLocaleString()}円`} sub="1人・1日" />
            <Fact icon={CalendarDays} label="いま行く理由" v="季節限定" sub={region.season} />
          </div>

          <p className="text-[11px] font-bold text-stone-400 mb-2">この町でできること</p>
          <ul className="space-y-2 mb-5">
            {region.places.map((p) => (
              <li key={p.id} className="flex gap-2.5 items-start">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-stone-300 shrink-0 mt-0.5">
                  {KIND_LABEL[p.kind]}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{p.name}</span>
                  <span className="block text-xs text-stone-400 leading-relaxed">{p.desc}</span>
                  {p.period && <span className="block text-[11px] text-amber-300 mt-0.5">{p.period}</span>}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex gap-2">
            <button onClick={() => { onPlan(region.id); onClose(); }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-[#0E1013] text-sm font-bold px-4 py-3 rounded-xl">
              <Sparkles className="w-4 h-4" />1日を組んでもらう
            </button>
            <button onClick={() => { onTraces(region.id); onClose(); }}
              className="inline-flex items-center justify-center gap-1.5 border border-white/15 text-stone-300 text-sm font-bold px-4 py-3 rounded-xl hover:bg-white/5">
              <Footprints className="w-4 h-4" />行った人
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Fact: React.FC<{ icon: React.ElementType; label: string; v: string; sub: string }> = ({ icon: Icon, label, v, sub }) => (
  <div className="rounded-xl bg-white/[0.04] p-2.5">
    <span className="flex items-center gap-1 text-[10px] font-bold text-stone-500 mb-1"><Icon className="w-3 h-3" />{label}</span>
    <span className="block text-xs font-bold">{v}</span>
    <span className="block text-[10px] text-stone-500 leading-snug mt-0.5">{sub}</span>
  </div>
);
