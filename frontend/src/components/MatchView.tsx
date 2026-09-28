import React, { useState } from 'react';
import { Sparkles, RotateCcw, ArrowRight } from 'lucide-react';
import type { Region, Vibe, WithWhom } from '../types';
import { anabaScore, anabaLabel, fmtDuration, VIBES, WHOM } from '../lib/anaba';

interface Props {
  regions: Region[];
  onOpen: (r: Region) => void;
}

type Answers = { whom?: WithWhom; vibe?: Vibe; minutes?: number; budget?: number };

const QUESTIONS = [
  { key: 'whom', q: '誰と行きますか', opts: WHOM.map((w) => ({ v: w.key, label: w.label })) },
  { key: 'vibe', q: 'どんな時間を過ごしたいですか', opts: VIBES.map((v) => ({ v: v.key, label: v.label })) },
  { key: 'minutes', q: '片道どれくらいまで出せますか', opts: [
      { v: 60, label: '1時間' }, { v: 120, label: '2時間' }, { v: 180, label: '3時間' }, { v: 240, label: '4時間' },
    ] },
  { key: 'budget', q: '1人あたりの予算は', opts: [
      { v: 4000, label: '〜4千円' }, { v: 7000, label: '〜7千円' }, { v: 10000, label: '〜1万円' }, { v: 15000, label: 'こだわらない' },
    ] },
] as const;

/** 4問に答えると、条件に合う町を穴場度順で返す。決めきれない人のための入口。 */
export const MatchView: React.FC<Props> = ({ regions, onOpen }) => {
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState<Answers>({});
  const done = step >= QUESTIONS.length;

  const pick = (key: string, v: string | number) => {
    setAns((p) => ({ ...p, [key]: v }));
    setStep((s) => s + 1);
  };

  const results = regions
    .filter((r) => (ans.whom ? r.withWhom.includes(ans.whom) : true))
    .filter((r) => (ans.vibe ? r.vibes.includes(ans.vibe) : true))
    .filter((r) => (ans.minutes ? r.access.minutes <= ans.minutes : true))
    .filter((r) => (ans.budget ? r.budget <= ans.budget : true))
    .sort((a, b) => anabaScore(b) - anabaScore(a));

  const reset = () => { setStep(0); setAns({}); };

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-1">相性で選ぶ</h1>
      <p className="text-sm text-stone-400 mb-6">
        4つ答えるだけ。自分で比較しなくていい状態にします。
      </p>

      {!done ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-[11px] font-bold text-amber-400 mb-2">
            {step + 1} / {QUESTIONS.length}
          </p>
          <h2 className="text-xl font-extrabold mb-5">{QUESTIONS[step].q}</h2>
          <div className="flex flex-wrap gap-2">
            {QUESTIONS[step].opts.map((o) => (
              <button key={String(o.v)} onClick={() => pick(QUESTIONS[step].key, o.v)}
                className="px-4 py-3 rounded-xl border border-white/15 text-sm font-semibold text-stone-200 hover:border-amber-400 hover:bg-amber-400/10 transition">
                {o.label}
              </button>
            ))}
          </div>
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)} className="mt-6 text-xs text-stone-500 hover:text-stone-300">
              ← ひとつ戻る
            </button>
          )}
        </section>
      ) : (
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-stone-300">
              <Sparkles className="w-4 h-4 inline text-amber-400 mr-1" />
              条件に合うのは <b className="text-amber-400">{results.length}件</b>。穴場度の高い順です。
            </p>
            <button onClick={reset} className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-300">
              <RotateCcw className="w-3.5 h-3.5" />やり直す
            </button>
          </div>

          {results.length === 0 ? (
            <p className="text-sm text-stone-500 border border-white/10 rounded-2xl p-6 text-center">
              条件に合う町がありませんでした。やり直して、時間か予算をゆるめてみてください。
            </p>
          ) : (
            <div className="grid gap-3">
              {results.map((r, i) => (
                <button key={r.id} onClick={() => onOpen(r)}
                  className="group text-left flex gap-4 p-3 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-amber-400/40 transition">
                  <span className="w-7 h-7 rounded-full bg-amber-400 text-[#0E1013] text-xs font-extrabold grid place-items-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <img src={r.image} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0 bg-white/5" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold">{r.name}<span className="text-[11px] text-stone-500 font-normal ml-2">{r.pref}</span></h3>
                    <p className="text-xs text-stone-400 mt-1 leading-snug">{r.catch}</p>
                    <p className="text-[11px] text-stone-500 mt-2">
                      {anabaLabel(anabaScore(r))}・{r.access.mode}で{fmtDuration(r.access.minutes)}・{r.budget.toLocaleString()}円
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-600 group-hover:text-amber-400 shrink-0 mt-1" />
                </button>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
