import React, { useState } from 'react';
import { CalendarDays, MapPin, Sparkles, Plus } from 'lucide-react';
import type { Region, Place } from '../types';
import { anabaScore, anabaLabel } from '../lib/anaba';

interface Props {
  regions: Region[];
  onPlan: (regionId: string) => void;
  onOpenPost: () => void;
}

/** 催し単位の一覧。地域から入るのが主線だが、日付や内容から探したい人向けに残す。 */
export const EventsView: React.FC<Props> = ({ regions, onPlan, onOpenPost }) => {
  const [onlyPeriod, setOnlyPeriod] = useState(false);

  const rows: { region: Region; place: Place }[] = regions.flatMap((r) =>
    r.places.filter((p) => p.kind === 'event').map((p) => ({ region: r, place: p }))
  ).filter((row) => (onlyPeriod ? !!row.place.period : true))
   .sort((a, b) => anabaScore(b.region) - anabaScore(a.region));

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="text-2xl font-extrabold">催し</h1>
        <button onClick={onOpenPost}
          className="inline-flex items-center gap-1.5 border border-white/15 text-stone-300 text-xs font-bold px-3 py-2 rounded-lg hover:bg-white/5 shrink-0">
          <Plus className="w-3.5 h-3.5" />催しを載せる
        </button>
      </div>
      <p className="text-sm text-stone-400 mb-5">
        地域から選ぶのが主線ですが、内容や日付から探したいときはこちら。並びは町の穴場度順です。
      </p>

      <label className="inline-flex items-center gap-2 text-xs text-stone-400 mb-5 cursor-pointer">
        <input type="checkbox" checked={onlyPeriod} onChange={(e) => setOnlyPeriod(e.target.checked)}
          className="accent-amber-400 w-4 h-4" />
        期間限定のものだけ
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map(({ region, place }) => (
          <article key={place.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-[#0E1013]">
                {anabaLabel(anabaScore(region))}
              </span>
              <span className="text-[11px] text-stone-500 inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" />{region.name}・{region.pref}
              </span>
            </div>

            <h2 className="font-bold text-sm leading-snug mb-1.5">{place.name}</h2>
            <p className="text-xs text-stone-400 leading-relaxed flex-1">{place.desc}</p>

            {place.period && (
              <p className="text-[11px] text-amber-300 mt-2 inline-flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />{place.period}
              </p>
            )}
            {place.tip && <p className="text-[11px] text-stone-500 mt-1">{place.tip}</p>}

            <button onClick={() => onPlan(region.id)}
              className="mt-3 inline-flex items-center justify-center gap-1.5 text-[11px] font-bold border border-amber-400/40 text-amber-200 px-3 py-2 rounded-lg hover:bg-amber-400/15">
              <Sparkles className="w-3.5 h-3.5" />この町の1日に組み込む
            </button>
          </article>
        ))}
      </div>
    </div>
  );
};
