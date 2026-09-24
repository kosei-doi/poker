import React from 'react';
import { Clock, Footprints, Lightbulb, MapPin, Sparkles, Star, Timer } from 'lucide-react';
import type { Spot } from '../types';
import { CATEGORY_MAP } from '../utils/categoryHelpers';
import { averageRating, countFootprints, hiddenGemScore } from '../utils/spotStats';
import { Modal } from './Modal';
import { SpotImage } from './SpotImage';

interface SpotDetailModalProps {
  spot: Spot | null;
  onClose: () => void;
  onAddFootprint: (spot: Spot) => void;
  onViewOnMap: (spot: Spot) => void;
  onPlanWithSpot: (spot: Spot) => void;
}

export const SpotDetailModal: React.FC<SpotDetailModalProps> = ({ spot, onClose, onAddFootprint, onViewOnMap, onPlanWithSpot }) => {
  if (!spot) return null;
  const meta = CATEGORY_MAP[spot.category];
  const { local, visitor } = countFootprints(spot);
  const rating = averageRating(spot);
  const footprints = [...spot.footprints].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Modal open onClose={onClose}>
      <div className="relative h-56 sm:h-64">
        <SpotImage spot={spot} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5 text-white">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${meta.badgeBg}`}>
            {meta.emoji} {meta.label}
          </span>
          <h2 className="mt-2 text-xl sm:text-2xl font-extrabold">{spot.name}</h2>
          <p className="text-xs sm:text-sm text-white/90">{spot.catchphrase}</p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="穴場度" value={`💎 ${hiddenGemScore(spot)}`} />
          <Stat label="評価" value={rating !== null ? `★ ${rating}` : '—'} />
          <Stat label="足跡 地元/旅人" value={`${local} / ${visitor}`} />
        </div>

        <p className="text-sm text-stone-700 leading-relaxed">{spot.description}</p>

        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
          <p className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 mb-1">
            <Lightbulb className="w-4 h-4" />
            地元の人だけが知っている楽しみ方
          </p>
          <p className="text-sm text-emerald-950 leading-relaxed">{spot.localTip}</p>
          <p className="mt-2 text-[11px] text-emerald-700">
            — {spot.author.name}（{spot.author.relation}）
          </p>
        </div>

        <ul className="grid sm:grid-cols-3 gap-2 text-xs text-stone-600">
          <li className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-stone-400" />{spot.bestTime}</li>
          <li className="flex items-center gap-1.5"><Timer className="w-4 h-4 text-stone-400" />滞在目安 {spot.stayMinutes}分</li>
          <li className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-stone-400" />{spot.address}</li>
        </ul>

        <div className="flex flex-wrap gap-1.5">
          {spot.tags.map((t) => (
            <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">#{t}</span>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button onClick={() => onAddFootprint(spot)} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm">
            <Footprints className="w-4 h-4" />足跡を残す
          </button>
          <button onClick={() => onViewOnMap(spot)} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm">
            <MapPin className="w-4 h-4" />足跡マップで見る
          </button>
          <button onClick={() => onPlanWithSpot(spot)} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm">
            <Sparkles className="w-4 h-4" />ここを含む旅プラン
          </button>
        </div>

        <section>
          <h3 className="font-extrabold text-stone-900 mb-2 flex items-center gap-1.5">
            <Footprints className="w-4 h-4 text-amber-600" />
            みんなの足跡（{footprints.length}）
          </h3>
          {footprints.length === 0 ? (
            <p className="text-xs text-stone-500">まだ足跡はありません。最初の足跡を残してみませんか？</p>
          ) : (
            <ul className="space-y-2">
              {footprints.map((fp) => (
                <li key={fp.id} className="flex gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100">
                  <span
                    className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white ${
                      fp.userType === 'local' ? 'bg-emerald-600' : 'bg-amber-500'
                    }`}
                  >
                    {fp.userType === 'local' ? '地元' : '旅人'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-stone-500">
                      <b className="text-stone-800">{fp.userName}</b>・{fp.profile}・{fp.date}
                      <span className="ml-1 text-amber-500">{'★'.repeat(fp.rating)}</span>
                    </p>
                    <p className="text-sm text-stone-700">{fp.comment}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Modal>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl bg-stone-50 border border-stone-100 py-2">
    <p className="text-[10px] text-stone-500">{label}</p>
    <p className="text-sm font-extrabold text-stone-900 flex items-center justify-center gap-1">
      {value.startsWith('★') ? <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> : null}
      {value.replace('★ ', '')}
    </p>
  </div>
);
