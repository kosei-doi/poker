import React from 'react';
import { Clock, Footprints, MapPin, Star } from 'lucide-react';
import type { Spot } from '../types';
import { CATEGORY_MAP } from '../utils/categoryHelpers';
import { averageRating, countFootprints, hiddenGemScore } from '../utils/spotStats';
import { SpotImage } from './SpotImage';

interface SpotCardProps {
  spot: Spot;
  onSelect: (spot: Spot) => void;
}

export const SpotCard: React.FC<SpotCardProps> = ({ spot, onSelect }) => {
  const meta = CATEGORY_MAP[spot.category];
  const { local, visitor } = countFootprints(spot);
  const rating = averageRating(spot);
  const gem = hiddenGemScore(spot);

  return (
    <button
      onClick={() => onSelect(spot)}
      className="group text-left bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col"
    >
      <div className="relative h-44 overflow-hidden">
        <SpotImage spot={spot} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <span className={`absolute top-3 left-3 text-[11px] font-bold px-2 py-0.5 rounded-full border ${meta.badgeBg}`}>
          {meta.emoji} {meta.label}
        </span>
        <span
          className="absolute top-3 right-3 text-[11px] font-black px-2 py-0.5 rounded-full bg-stone-900/80 text-white backdrop-blur-sm"
          title="地元の足跡が多く、旅人の足跡が少ないほど高くなります"
        >
          💎 穴場度 {gem}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-1 text-[11px] text-stone-500">
          <MapPin className="w-3 h-3" />
          <span>{spot.area}</span>
          {rating !== null && (
            <span className="ml-auto flex items-center gap-0.5 text-amber-600 font-bold">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              {rating}
            </span>
          )}
        </div>
        <h3 className="font-extrabold text-stone-900 leading-snug">{spot.name}</h3>
        <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">{spot.catchphrase}</p>

        <div className="mt-auto pt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
          <span className="text-stone-500 truncate">
            by <b className="text-stone-700">{spot.author.name}</b>
          </span>
          <span className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-0.5 text-emerald-700 font-bold" title="地元の人の足跡">
              <Footprints className="w-3 h-3" />地元 {local}
            </span>
            <span className="flex items-center gap-0.5 text-amber-700 font-bold" title="旅人の足跡">
              <Footprints className="w-3 h-3" />旅人 {visitor}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-stone-400">
          <Clock className="w-3 h-3" />
          {spot.bestTime}
        </div>
      </div>
    </button>
  );
};
