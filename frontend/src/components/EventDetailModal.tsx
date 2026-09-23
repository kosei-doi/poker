import React from 'react';
import { 
  X, Calendar, Clock, MapPin, Users, DollarSign, 
  Sparkles, Footprints, Compass, Plus 
} from 'lucide-react';
import type { EventItem } from '../types';
import { CATEGORY_MAP } from '../utils/categoryHelpers';

interface EventDetailModalProps {
  event: EventItem | null;
  onClose: () => void;
  onViewOnMap: (event: EventItem) => void;
  onOpenAddFootprint: (event: EventItem) => void;
  onPlanTripWithEvent: (event: EventItem) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  onViewOnMap,
  onOpenAddFootprint,
  onPlanTripWithEvent
}) => {
  if (!event) return null;

  const catMeta = CATEGORY_MAP[event.category] || CATEGORY_MAP.festival;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div 
        className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-stone-200 my-auto flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-stone-900/60 hover:bg-stone-900 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          {/* Hero Banner */}
          <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-stone-100">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
            
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-xs ${catMeta.color}`}>
                  {catMeta.label}
                </span>
                <span className="bg-amber-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                  <Footprints className="w-3.5 h-3.5" />
                  足跡 {event.footprints.length}件
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight text-white mb-1 drop-shadow-sm">
                {event.title}
              </h2>
              <p className="text-sm sm:text-base text-emerald-200 font-medium line-clamp-1">
                {event.catchphrase}
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-7 space-y-6">
            {/* Quick Meta Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
              <div className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-700">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-stone-900">開催日・時間</div>
                  <div>{event.date}</div>
                  <div className="text-stone-500 text-xs flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{event.time}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-700">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-stone-900">開催場所</div>
                  <div>{event.locationName}</div>
                  <div className="text-stone-500 text-xs mt-0.5">{event.address}</div>
                </div>
              </div>

              {event.fee && (
                <div className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-700">
                  <DollarSign className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-stone-900">参加費</div>
                    <div>{event.fee}</div>
                  </div>
                </div>
              )}

              {event.capacity && (
                <div className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-700">
                  <Users className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-stone-900">定員・参加条件</div>
                    <div>{event.capacity}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-base font-bold text-stone-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>催しの内容と見どころ</span>
              </h3>
              <p className="text-stone-700 leading-relaxed text-sm sm:text-base whitespace-pre-line bg-white">
                {event.description}
              </p>
            </div>

            {/* Organizer Story (Heart of Local Revitalization) */}
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50/40 to-stone-50 border border-emerald-200/80 rounded-2xl p-5">
              <div className="text-xs font-bold text-emerald-800 tracking-wider uppercase mb-2">
                地域主催者の想い・ストーリー
              </div>
              <div className="flex items-start gap-3.5">
                <img
                  src={event.organizer.avatar}
                  alt={event.organizer.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400 shadow-sm shrink-0"
                />
                <div>
                  <div className="font-bold text-stone-900 text-sm sm:text-base">
                    {event.organizer.name}
                  </div>
                  <div className="text-xs text-stone-600 mb-2">{event.organizer.role}</div>
                  <p className="text-xs sm:text-sm text-stone-800 leading-relaxed italic bg-white/70 p-3 rounded-xl border border-emerald-100">
                    “{event.organizer.story}”
                  </p>
                </div>
              </div>
            </div>

            {/* Footprints Section (足跡・参加者の声) */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Footprints className="w-5 h-5 text-amber-500" />
                  <span>参加者の足跡・リアルな声（{event.footprints.length}件）</span>
                </h3>
                <button
                  onClick={() => onOpenAddFootprint(event)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 text-xs font-bold transition-all shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>足跡を残す</span>
                </button>
              </div>

              {event.footprints.length === 0 ? (
                <div className="text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-stone-500 text-xs">
                  まだ足跡がありません。あなたが最初の足跡を残してみませんか？
                </div>
              ) : (
                <div className="space-y-3">
                  {event.footprints.map((fp) => (
                    <div
                      key={fp.id}
                      className="bg-stone-50 hover:bg-amber-50/40 transition-colors p-4 rounded-2xl border border-stone-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {fp.avatarUrl ? (
                            <img
                              src={fp.avatarUrl}
                              alt={fp.userName}
                              className="w-7 h-7 rounded-full object-cover border border-stone-300"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                              {fp.userName.slice(0, 1)}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-xs text-stone-900 mr-2">
                              {fp.userName}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-medium">
                              {fp.userType}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-stone-400">
                          <span className="text-amber-500 font-bold">★ {fp.rating}</span>
                          <span className="text-[11px]">• {fp.date}</span>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-stone-700 leading-relaxed pl-1">
                        {fp.comment}
                      </p>
                      {fp.highlightTag && (
                        <div className="mt-2 inline-block text-[11px] text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md font-medium">
                          💡 {fp.highlightTag}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Nearby Spots */}
            {event.nearbySpots && event.nearbySpots.length > 0 && (
              <div className="pt-2">
                <h3 className="text-base font-bold text-stone-900 mb-3 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-teal-600" />
                  <span>周辺の立ち寄りスポット（あわせて巡る）</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {event.nearbySpots.map((spot) => (
                    <div
                      key={spot.id}
                      className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 hover:bg-stone-100 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-stone-900">{spot.name}</span>
                        <span className="text-stone-500 bg-white px-1.5 py-0.5 rounded border border-stone-200">
                          {spot.distance}
                        </span>
                      </div>
                      <div className="text-[11px] text-teal-700 font-semibold mb-1">
                        {spot.category}
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {spot.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-stone-100/90 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onViewOnMap(event);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 text-xs sm:text-sm font-semibold transition-all shadow-2xs"
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>マップで位置を見る</span>
            </button>
            <button
              onClick={() => onOpenAddFootprint(event)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs"
            >
              <Footprints className="w-4 h-4" />
              <span>足跡を投稿する</span>
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onPlanTripWithEvent(event);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition-all ml-auto"
          >
            <Compass className="w-4 h-4" />
            <span>この催しから周遊コースを作る</span>
          </button>
        </div>
      </div>
    </div>
  );
};
