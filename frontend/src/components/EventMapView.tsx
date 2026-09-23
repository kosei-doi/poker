import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { 
  Footprints, MapPin, Calendar, ArrowRight, 
  Filter, Star, Maximize2, RotateCcw, 
  Sparkles, X, ChevronRight, Compass
} from 'lucide-react';
import type { EventItem, Footprint } from '../types';
import { CATEGORY_MAP } from '../utils/categoryHelpers';

interface EventMapViewProps {
  events: EventItem[];
  selectedEventForMap: EventItem | null;
  onSelectEvent: (event: EventItem) => void;
  onOpenAddFootprint: (event: EventItem) => void;
  onPlanTrip?: (event: EventItem) => void;
}

export const EventMapView: React.FC<EventMapViewProps> = ({
  events,
  selectedEventForMap,
  onSelectEvent,
  onOpenAddFootprint,
  onPlanTrip,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [activeEvent, setActiveEvent] = useState<EventItem | null>(selectedEventForMap || events[0] || null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [footprintFilter, setFootprintFilter] = useState<'all' | 'tourist' | 'relocate'>('all');

  // Filtered events based on category
  const filteredEvents = React.useMemo(() => {
    if (filterCategory === 'all') return events;
    return events.filter((e) => e.category === filterCategory);
  }, [events, filterCategory]);

  // All footprints sorted by date desc with optional userType filter
  const displayedFootprints = React.useMemo(() => {
    const list: { fp: Footprint; event: EventItem }[] = [];
    events.forEach((evt) => {
      evt.footprints.forEach((fp) => {
        if (footprintFilter === 'all') {
          list.push({ fp, event: evt });
        } else if (footprintFilter === 'tourist' && fp.userType === '観光客') {
          list.push({ fp, event: evt });
        } else if (footprintFilter === 'relocate' && (fp.userType === '移住検討中' || fp.userType === 'ワーケーション')) {
          list.push({ fp, event: evt });
        }
      });
    });
    return list.sort((a, b) => b.fp.date.localeCompare(a.fp.date));
  }, [events, footprintFilter]);

  // Fit all pins in map view
  const handleFitAllPins = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || filteredEvents.length === 0) return;

    const bounds = L.latLngBounds(filteredEvents.map((e) => [e.lat, e.lng]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: true });
  }, [filteredEvents]);

  // Reset to initial center
  const handleResetCenter = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([36.28, 137.90], 11, { duration: 0.8 });
  }, []);

  // Initialize Leaflet Map safely (Fixing tab switch & size invalidation bugs)
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    // Fix: Clean up any previous Leaflet state on container if it exists
    if ((container as unknown as { _leaflet_id?: number })._leaflet_id) {
      (container as unknown as { _leaflet_id?: null })._leaflet_id = null;
    }

    if (!mapInstanceRef.current) {
      const map = L.map(container, {
        center: [36.28, 137.90],
        zoom: 11,
        zoomControl: false, // We'll add custom positioned zoom control
      });

      // Add Zoom control to top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // OpenStreetMap Tiles with proper attribution
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // FIX BUG: Invalidate map size after DOM stabilizes (crucial for tabs)
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
      setTimeout(() => {
        map.invalidateSize();
      }, 400);
    }

    // FIX BUG: Attach ResizeObserver to keep tiles rendered properly
    if (window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserverRef.current.observe(container);
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers whenever filteredEvents or activeEvent changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    filteredEvents.forEach((evt) => {
      const meta = CATEGORY_MAP[evt.category] || CATEGORY_MAP.festival;
      const footprintCount = evt.footprints.length;
      const isActive = activeEvent?.id === evt.id;

      // Custom HTML Marker with pulse/glow if active
      const iconHtml = `
        <div class="relative group cursor-pointer">
          ${
            isActive
              ? `<div class="absolute -inset-2 rounded-full bg-amber-400 opacity-60 animate-ping"></div>`
              : ''
          }
          <div class="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xl border-2 ${
            isActive ? 'border-amber-300 ring-4 ring-amber-400/40 scale-110' : 'border-white'
          } transform transition-all duration-300 hover:scale-125" style="background-color: ${meta.pinBg}">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          ${
            footprintCount > 0
              ? `<div class="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-md border border-white">
                  ${footprintCount}
                </div>`
              : ''
          }
          <div class="absolute top-11 left-1/2 -translate-x-1/2 whitespace-nowrap bg-stone-900/95 text-white text-[10px] font-semibold px-2 py-0.5 rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
            ${evt.title.slice(0, 16)}...
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-map-pin',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([evt.lat, evt.lng], { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        setActiveEvent(evt);
        map.flyTo([evt.lat, evt.lng], 13, { duration: 0.8 });
      });

      markersRef.current[evt.id] = marker;
    });
  }, [filteredEvents, activeEvent]);

  // Handle selectedEvent from external prop (e.g. from event card click)
  useEffect(() => {
    if (selectedEventForMap && mapInstanceRef.current) {
      setActiveEvent(selectedEventForMap);
      // Wait for layout stability
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          mapInstanceRef.current.flyTo(
            [selectedEventForMap.lat, selectedEventForMap.lng],
            13,
            { duration: 0.9 }
          );
        }
      }, 100);
    }
  }, [selectedEventForMap]);

  const handleFocusEvent = (evt: EventItem) => {
    setActiveEvent(evt);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([evt.lat, evt.lng], 13, { duration: 0.8 });
    }
  };

  const [mobileViewMode, setMobileViewMode] = useState<'map' | 'list'>('map');

  return (
    <div className="space-y-4 pb-8">
      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm sm:text-base font-extrabold text-stone-900 tracking-tight">
              地域イベント ✕ 旅人の足跡マップ
            </h2>
            <span className="text-[11px] bg-amber-100 text-amber-900 font-bold px-2 py-0.2 rounded-full border border-amber-300">
              👣 足跡 {displayedFootprints.length}件
            </span>
          </div>
          <p className="text-[11px] text-stone-500">
            ピンを押すと、催しの詳細と過去に参加した旅人のリアルな足跡が確認できます。
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-stone-500" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs bg-transparent text-stone-700 font-semibold focus:outline-hidden"
            >
              <option value="all">すべての催し ({events.length})</option>
              <option value="marche">マルシェ・食</option>
              <option value="festival">祭り・伝統</option>
              <option value="workshop">体験・学び</option>
              <option value="nature">自然・農業</option>
              <option value="culture">アート・音楽</option>
            </select>
          </div>

          {/* Quick Map Controls */}
          <button
            onClick={handleFitAllPins}
            title="すべての催しが収まるようにズーム"
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>全体</span>
          </button>

          <button
            onClick={handleResetCenter}
            title="地域の中心に戻す"
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>リセット</span>
          </button>
        </div>
      </div>

      {/* Mobile Mode Switcher (Visible only on lg:hidden) */}
      <div className="lg:hidden flex items-center bg-stone-200/70 p-1 rounded-xl">
        <button
          onClick={() => {
            setMobileViewMode('map');
            setTimeout(() => mapInstanceRef.current?.invalidateSize(), 50);
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mobileViewMode === 'map'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>地図を見る</span>
        </button>
        <button
          onClick={() => setMobileViewMode('list')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mobileViewMode === 'list'
              ? 'bg-white text-amber-800 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Footprints className="w-3.5 h-3.5 text-amber-600" />
          <span>足跡一覧 ({displayedFootprints.length})</span>
        </button>
      </div>

      {/* Main Map & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[380px] sm:h-[450px] lg:h-[500px]">
        {/* Leaflet Map Container */}
        <div className={`lg:col-span-8 h-full rounded-2xl overflow-hidden border border-stone-200 shadow-md relative bg-stone-100 ${
          mobileViewMode === 'list' ? 'hidden lg:block' : 'block'
        }`}>
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Map Overlay Floating Active Event Card */}
          {activeEvent && (
            <div 
              onMouseDown={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
              className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-md z-20 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-stone-200 shadow-2xl animate-fadeIn"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white ${
                      (CATEGORY_MAP[activeEvent.category] || CATEGORY_MAP.festival).color
                    }`}
                  >
                    {(CATEGORY_MAP[activeEvent.category] || CATEGORY_MAP.festival).label}
                  </span>
                  <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Footprints className="w-3 h-3 text-amber-600" />
                    足跡 {activeEvent.footprints.length}件
                  </span>
                </div>
                <button
                  onClick={() => setActiveEvent(null)}
                  className="w-6 h-6 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h4 className="font-extrabold text-base text-stone-900 line-clamp-1 mb-1">
                {activeEvent.title}
              </h4>

              <div className="flex items-center gap-2 text-xs text-stone-500 mb-3">
                <span className="flex items-center gap-1 font-medium text-stone-700">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="truncate max-w-[150px]">{activeEvent.locationName}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{activeEvent.date.slice(0, 15)}</span>
                </span>
              </div>

              {/* Latest footprint quote if exists */}
              {activeEvent.footprints.length > 0 && (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 mb-3">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 mb-1">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>参加者の足跡（{activeEvent.footprints[activeEvent.footprints.length - 1].userName}さん）</span>
                    </span>
                    <span className="text-[10px] bg-amber-200/60 px-1.5 py-0.2 rounded text-amber-900">
                      ★ {activeEvent.footprints[activeEvent.footprints.length - 1].rating}
                    </span>
                  </div>
                  <p className="text-xs text-stone-700 italic line-clamp-2 leading-relaxed">
                    “{activeEvent.footprints[activeEvent.footprints.length - 1].comment}”
                  </p>
                </div>
              )}

              {/* Actions Grid */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSelectEvent(activeEvent)}
                    className="py-2 px-3 rounded-xl bg-stone-900 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                  >
                    <span>詳細・想いを見る</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onOpenAddFootprint(activeEvent)}
                    className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-xs"
                  >
                    <Footprints className="w-3.5 h-3.5" />
                    <span>足跡を残す</span>
                  </button>
                </div>

                {onPlanTrip && (
                  <button
                    onClick={() => onPlanTrip(activeEvent)}
                    className="w-full py-1.5 px-3 rounded-xl bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1 transition-colors border border-stone-200/70"
                  >
                    <Compass className="w-3.5 h-3.5 text-teal-600" />
                    <span>この催しから周遊コースを作る</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Recent Community Footprints Stream */}
        <div className={`lg:col-span-4 h-full bg-white rounded-2xl border border-stone-200 shadow-md p-3.5 sm:p-4 flex-col ${
          mobileViewMode === 'map' ? 'hidden lg:flex' : 'flex'
        }`}>
          {/* Sidebar Header */}
          <div className="pb-3 border-b border-stone-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-sm sm:text-base text-stone-900 flex items-center gap-1.5">
                <Footprints className="w-4 h-4 text-amber-500" />
                <span>参加者の足跡タイムライン</span>
              </h3>
            </div>
            <p className="text-xs text-stone-500 mb-3">
              足跡をクリックすると地図上の開催地にズームします
            </p>

            {/* Footprint Type Switcher */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
              {[
                { id: 'all', label: 'すべて' },
                { id: 'tourist', label: '観光客' },
                { id: 'relocate', label: '移住・ワーケ' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFootprintFilter(tab.id as typeof footprintFilter)}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                    footprintFilter === tab.id
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Footprints Scrollable Stream */}
          <div className="flex-1 overflow-y-auto space-y-3 pt-3 pr-1">
            {displayedFootprints.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-xs">
                該当する足跡がまだありません。
              </div>
            ) : (
              displayedFootprints.map(({ fp, event }) => {
                const isSelected = activeEvent?.id === event.id;
                return (
                  <div
                    key={fp.id}
                    onClick={() => handleFocusEvent(event)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/40 shadow-xs'
                        : 'bg-stone-50/70 hover:bg-stone-100/90 border-stone-200'
                    }`}
                  >
                    {/* Event Name Tag */}
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-emerald-800 line-clamp-1 max-w-[200px] group-hover:text-emerald-900">
                        📍 {event.title}
                      </span>
                      <span className="text-[10px] text-stone-400 shrink-0">{fp.date}</span>
                    </div>

                    {/* Comment */}
                    <p className="text-xs text-stone-700 leading-relaxed line-clamp-3 mb-2 font-serif">
                      “{fp.comment}”
                    </p>

                    {/* Footprint Author & Rating */}
                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-stone-200/60">
                      <div className="flex items-center gap-1.5">
                        {fp.avatarUrl ? (
                          <img
                            src={fp.avatarUrl}
                            alt={fp.userName}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                            {fp.userName.slice(0, 1)}
                          </div>
                        )}
                        <span className="font-semibold text-stone-800 truncate max-w-[100px]">{fp.userName}</span>
                        <span className="text-[9px] bg-stone-200/70 text-stone-600 px-1.5 py-0.2 rounded font-medium">
                          {fp.userType}
                        </span>
                      </div>

                      <div className="flex items-center text-amber-500 font-bold text-xs shrink-0">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span className="ml-0.5">{fp.rating}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform ml-1" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
