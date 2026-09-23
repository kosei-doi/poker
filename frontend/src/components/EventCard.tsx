import React from 'react';
import { Calendar, MapPin, Footprints, ArrowRight } from 'lucide-react';
import type { EventItem } from '../types';
import { CATEGORY_MAP } from '../utils/categoryHelpers';

interface EventCardProps {
  event: EventItem;
  onSelect: (event: EventItem) => void;
  onViewOnMap: (event: EventItem) => void;
  onAddFootprint: (event: EventItem) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onSelect,
  onViewOnMap,
  onAddFootprint
}) => {
  const catMeta = CATEGORY_MAP[event.category] || CATEGORY_MAP.festival;
  const recentFootprint = event.footprints[event.footprints.length - 1];

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">
      {/* Image & Badges Header */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-stone-100">
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Category Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md bg-white/90 shadow-xs border border-white/50">
          <span className={`w-2 h-2 rounded-full ${catMeta.color}`}></span>
          <span className="text-stone-800">{catMeta.label}</span>
        </div>

        {/* Footprint Count Badge & Quick Add */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddFootprint(event);
          }}
          title="この催しに足跡を残す"
          className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white backdrop-blur-md shadow-xs transition-colors"
        >
          <Footprints className="w-3.5 h-3.5" />
          <span>足跡 {event.footprints.length}件</span>
        </button>

        {/* Date Over Image */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-200 mb-0.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{event.date}</span>
          </div>
          <h3 className="text-lg font-bold line-clamp-1 leading-snug drop-shadow-xs">
            {event.title}
          </h3>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div>
          {/* Location & Time */}
          <div className="flex items-start gap-1.5 text-xs text-stone-600 mb-2">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
            <span className="line-clamp-1 font-medium">{event.locationName}</span>
          </div>

          {/* Catchphrase / Short Description */}
          <p className="text-xs text-stone-700 line-clamp-2 leading-relaxed mb-3">
            {event.catchphrase || event.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {event.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Recent Footprint Quote (if available) */}
          {recentFootprint && (
            <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-2.5 mb-3">
              <div className="flex items-center justify-between text-[11px] text-amber-900 font-semibold mb-1">
                <span className="flex items-center gap-1">
                  <Footprints className="w-3 h-3 text-amber-600" />
                  <span>参加者の足跡（{recentFootprint.userName}）</span>
                </span>
                <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                  {recentFootprint.userType}
                </span>
              </div>
              <p className="text-xs text-stone-700 line-clamp-2 italic">
                “{recentFootprint.comment}”
              </p>
            </div>
          )}

          {/* Organizer Info */}
          <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
            <img
              src={event.organizer.avatar}
              alt={event.organizer.name}
              className="w-7 h-7 rounded-full object-cover border border-stone-200"
            />
            <div className="text-[11px] leading-tight">
              <p className="font-semibold text-stone-800">{event.organizer.name}</p>
              <p className="text-stone-500 truncate max-w-[180px]">{event.organizer.role}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 grid grid-cols-2 gap-2">
          <button
            onClick={() => onViewOnMap(event)}
            className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-stone-700 hover:text-emerald-700 text-xs font-semibold transition-all"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>地図で見る</span>
          </button>
          
          <button
            onClick={() => onSelect(event)}
            className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-stone-900 hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all"
          >
            <span>詳細を見る</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
