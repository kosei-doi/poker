import React, { useState } from 'react';
import { Sparkles, Clock, Wallet, Car, Copy, Check, Loader2, MapPin } from 'lucide-react';
import type { Region, Plan } from '../types';
import { buildPlan, fmtDuration, KIND_LABEL } from '../lib/anaba';

interface Props {
  regions: Region[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export const PlanView: React.FC<Props> = ({ regions, selectedId, onSelect }) => {
  const region = regions.find((r) => r.id === selectedId) || regions[0];
  const [plan, setPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [start, setStart] = useState('10:00');
  const [copied, setCopied] = useState(false);

  const generate = () => {
    setBusy(true);
    setPlan(null);
    setTimeout(() => {
      setPlan(buildPlan(region, start));
      setBusy(false);
    }, 900);
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(region.invite);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* クリップボードが使えない環境では何もしない */ }
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-1">1日プラン</h1>
      <p className="text-sm text-stone-400 mb-6">
        催しだけでなく、食べる場所と撮る場所、移動の時間まで入れて組みます。自分で組まなくていい状態にするのが目的です。
      </p>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 mb-5">
        <div className="flex flex-wrap gap-2 mb-4">
          {regions.map((r) => (
            <button key={r.id} onClick={() => { onSelect(r.id); setPlan(null); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                r.id === region.id ? 'bg-amber-400 border-amber-400 text-[#0E1013]' : 'border-white/15 text-stone-400 hover:text-stone-100'
              }`}>{r.name}</button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <label className="text-[11px] font-bold text-stone-400">
            <span className="block mb-1.5">出発時刻</span>
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)}
              className="bg-[#0E1013] border border-white/15 rounded-lg px-3 py-2 text-sm text-stone-100" />
          </label>
          <button onClick={generate} disabled={busy}
            className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-[#0E1013] text-sm font-bold px-5 py-2.5 rounded-xl">
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" />組み立て中</> : <><Sparkles className="w-4 h-4" />この町の1日を組む</>}
          </button>
        </div>
        <p className="text-[11px] text-stone-500 mt-3">
          いまは手元のデータから組み立てています。本番では、自治体ページとSNSの投稿をLLMに読ませて同じ形に整えます。
        </p>
      </section>

      {plan && (
        <section className="rounded-2xl border border-amber-400/30 bg-white/[0.03] overflow-hidden">
          <div className="p-5 border-b border-white/10">
            <h2 className="text-xl font-extrabold mb-2">{plan.title}</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stone-400">
              <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />所要 {fmtDuration(plan.totalMinutes)}</span>
              <span className="inline-flex items-center gap-1"><Wallet className="w-3.5 h-3.5" />1人 {plan.budget.toLocaleString()}円</span>
              <span className="inline-flex items-center gap-1"><Car className="w-3.5 h-3.5" />{plan.transport}</span>
            </div>
          </div>

          <ol className="p-5 pt-4">
            {plan.steps.map((s, i) => (
              <li key={s.place.id} className="relative pl-20 pb-6 last:pb-0">
                <span className="absolute left-0 top-0 text-sm font-bold text-amber-400 tabular-nums">{s.time}</span>
                <span className="absolute left-[58px] top-1.5 w-2 h-2 rounded-full bg-amber-400" />
                {i < plan.steps.length - 1 && (
                  <span className="absolute left-[62px] top-4 bottom-0 w-px bg-white/15" />
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-stone-300">
                      {KIND_LABEL[s.place.kind]}
                    </span>
                    <h3 className="font-bold text-sm">{s.place.name}</h3>
                    <span className="text-[10px] text-stone-500">{fmtDuration(s.place.stay)}</span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">{s.place.desc}</p>
                  {s.place.tip && <p className="text-xs text-amber-300/90 mt-1">{s.place.tip}</p>}
                  <p className="text-[11px] text-stone-600 mt-1">{s.note}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="m-5 mt-0 rounded-xl bg-amber-400/10 border border-amber-400/25 p-4">
            <p className="text-[11px] font-bold text-amber-300 mb-1.5">そのまま送れる、友達への誘い文句</p>
            <p className="text-xs text-stone-200 leading-relaxed mb-3">{region.invite}</p>
            <button onClick={copyInvite}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold border border-amber-400/40 text-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-400/15">
              {copied ? <><Check className="w-3.5 h-3.5" />コピーしました</> : <><Copy className="w-3.5 h-3.5" />コピー</>}
            </button>
          </div>
        </section>
      )}

      {!plan && !busy && (
        <p className="text-sm text-stone-500 border border-white/10 border-dashed rounded-2xl p-8 text-center">
          <MapPin className="w-5 h-5 mx-auto mb-2 text-stone-600" />
          町を選んで「この町の1日を組む」を押してください。
        </p>
      )}
    </div>
  );
};
