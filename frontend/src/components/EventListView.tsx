import React, { useState, useMemo } from 'react';
import { 
  Search, Sparkles, Filter, Footprints, Calendar, 
  Compass, ArrowRight, UserCheck 
} from 'lucide-react';
import type { EventItem, EventCategory } from '../types';
import { EventCard } from './EventCard';
import { CATEGORY_MAP } from '../utils/categoryHelpers';

interface EventListViewProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  onViewOnMap: (event: EventItem) => void;
  onAddFootprint: (event: EventItem) => void;
  onGoToPlanner: () => void;
  onGoToMatching: () => void;
}

export const EventListView: React.FC<EventListViewProps> = ({
  events,
  onSelectEvent,
  onViewOnMap,
  onAddFootprint,
  onGoToPlanner,
  onGoToMatching,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAudience, setSelectedAudience] = useState<string>('all');

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const matchQuery =
        searchQuery === '' ||
        evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory =
        selectedCategory === 'all' || evt.category === selectedCategory;

      const matchAudience =
        selectedAudience === 'all' ||
        evt.recommendedFor.some((rec) => rec.includes(selectedAudience));

      return matchQuery && matchCategory && matchAudience;
    });
  }, [events, searchQuery, selectedCategory, selectedAudience]);

  const totalFootprints = useMemo(() => {
    return events.reduce((acc, curr) => acc + curr.footprints.length, 0);
  }, [events]);

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-800 via-teal-800 to-stone-900 text-white shadow-xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative z-10 px-5 sm:px-12 py-8 sm:py-14 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-3 sm:mb-4 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>地域と外の旅人を結ぶローカル体験</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-snug sm:leading-tight mb-3 sm:mb-4">
            観光地の先にある、<br className="hidden sm:inline" />
            <span className="text-emerald-300 underline decoration-amber-400 decoration-wavy decoration-2">
              地域の「あたたかい催し」
            </span>
            に出会う旅へ。
          </h1>

          <p className="text-stone-200 text-xs sm:text-base leading-relaxed mb-5 sm:mb-6 max-w-2xl">
            地元のおじいちゃんが守る朝市、蔵元と語らう味噌仕込み、鎮守の杜の竹灯籠。
            外から訪れる人が安心して地域に溶け込み、参加者の「足跡（体験談）」から次の物語を見つけるプラットフォームです。
          </p>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs sm:text-sm">
            <button
              onClick={onGoToMatching}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-900 font-extrabold transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-stone-900" />
              <span>条件からぴったりな催しを診断</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onGoToPlanner}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold backdrop-blur-md border border-white/20 transition-all"
            >
              <Compass className="w-4 h-4 text-teal-300" />
              <span>AI周遊プラン</span>
            </button>

            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-2 rounded-xl backdrop-blur-md border border-white/10 text-stone-200 text-xs">
              <Calendar className="w-3.5 h-3.5 text-emerald-300" />
              <span>催し: <strong className="text-white font-bold">{events.length}件</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-2 rounded-xl backdrop-blur-md border border-white/10 text-stone-200 text-xs">
              <Footprints className="w-3.5 h-3.5 text-amber-300" />
              <span>足跡: <strong className="text-amber-300 font-bold">{totalFootprints}件</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="催し名、地名、キーワード（例: マルシェ、味噌、竹灯籠、ワーケーション）で探す..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-stone-100">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-stone-500 mr-1 shrink-0 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              分類:
            </span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              すべて
            </button>
            {(Object.keys(CATEGORY_MAP) as EventCategory[]).map((catKey) => {
              const meta = CATEGORY_MAP[catKey];
              const isSelected = selectedCategory === catKey;
              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? `${meta.color} text-white shadow-2xs`
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? 'bg-white' : meta.color
                    }`}
                  />
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>

          {/* Audience Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-bold text-stone-500 mr-1 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              対象:
            </span>
            <select
              value={selectedAudience}
              onChange={(e) => setSelectedAudience(e.target.value)}
              className="text-xs border border-stone-200 bg-stone-50 px-3 py-1.5 rounded-lg text-stone-700 font-medium focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">すべての旅人</option>
              <option value="観光">観光・旅行者歓迎</option>
              <option value="移住">移住検討・下見</option>
              <option value="ワーケーション">ワーケーション</option>
              <option value="ファミリー">親子・ファミリー</option>
            </select>
          </div>
        </div>
      </div>

      {/* Event Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <span>開催予定の催し</span>
            <span className="text-xs font-normal text-stone-500">
              （{filteredEvents.length}件が見つかりました）
            </span>
          </h2>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-3">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-stone-800 text-base mb-1">
              条件に一致する催しが見つかりませんでした
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              検索ワードを変更するか、フィルターをリセットしてお試しください。
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedAudience('all');
              }}
              className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-emerald-600 transition-all"
            >
              条件をリセット
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onSelect={onSelectEvent}
                onViewOnMap={onViewOnMap}
                onAddFootprint={onAddFootprint}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
