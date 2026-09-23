import React from 'react';
import { Calendar, MapPin, Compass, PlusCircle, Compass as LogoIcon, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeTab: 'events' | 'matching' | 'map' | 'planner';
  setActiveTab: (tab: 'events' | 'matching' | 'map' | 'planner') => void;
  onOpenPostModal: () => void;
  eventCount: number;
  totalFootprints: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenPostModal,
  eventCount,
  totalFootprints,
}) => {
  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo & Service Name */}
            <div
              className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0"
              onClick={() => setActiveTab('events')}
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
                <LogoIcon className="w-4 h-4 sm:w-6 sm:h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-extrabold text-base sm:text-xl tracking-tight text-stone-900 font-sans">
                    めぐりまち
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-300 whitespace-nowrap">
                    地域創生
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 hidden md:block">
                  地域の催しと旅人の足跡をつなぐプラットフォーム
                </p>
              </div>
            </div>

            {/* Desktop Navigation Tabs (Visible only on md and larger screens) */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              <button
                onClick={() => setActiveTab('events')}
                className={`flex items-center gap-1.5 px-3 lg:px-3.5 py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all ${
                  activeTab === 'events'
                    ? 'bg-emerald-50 text-emerald-700 shadow-xs border border-emerald-200'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>催し一覧</span>
                <span className="ml-1 text-xs px-1.5 py-0.2 bg-stone-100 text-stone-600 rounded-full">
                  {eventCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('matching')}
                className={`flex items-center gap-1.5 px-3 lg:px-3.5 py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all ${
                  activeTab === 'matching'
                    ? 'bg-amber-50 text-amber-800 shadow-xs border border-amber-300'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>ぴったり診断</span>
                <span className="ml-0.5 text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold rounded-full">
                  AI
                </span>
              </button>

              <button
                onClick={() => setActiveTab('map')}
                className={`flex items-center gap-1.5 px-3 lg:px-3.5 py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all ${
                  activeTab === 'map'
                    ? 'bg-emerald-50 text-emerald-700 shadow-xs border border-emerald-200'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>足跡マップ</span>
                <span className="ml-1 text-xs px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold rounded-full">
                  👣 {totalFootprints}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('planner')}
                className={`flex items-center gap-1.5 px-3 lg:px-3.5 py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all ${
                  activeTab === 'planner'
                    ? 'bg-emerald-50 text-emerald-700 shadow-xs border border-emerald-200'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Compass className="w-4 h-4 text-teal-600" />
                <span>周遊プラン</span>
              </button>
            </nav>

            {/* Action Button: Post Event */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenPostModal}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 hover:shadow-lg transition-all active:scale-95 whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">催しを投稿</span>
                <span className="sm:hidden">投稿</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Visible only on screens below md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200 shadow-lg px-2 py-1.5 flex items-center justify-around safe-area-pb">
        <button
          onClick={() => setActiveTab('events')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'events'
              ? 'text-emerald-700 font-bold bg-emerald-50'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">催し一覧</span>
        </button>

        <button
          onClick={() => setActiveTab('matching')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'matching'
              ? 'text-amber-800 font-bold bg-amber-50'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <span className="text-[10px] mt-0.5">ぴったり診断</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'map'
              ? 'text-emerald-700 font-bold bg-emerald-50'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span className="text-[10px] mt-0.5">足跡マップ</span>
        </button>

        <button
          onClick={() => setActiveTab('planner')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'planner'
              ? 'text-teal-700 font-bold bg-teal-50'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Compass className="w-4 h-4 text-teal-600" />
          <span className="text-[10px] mt-0.5">周遊プラン</span>
        </button>
      </nav>
    </>
  );
};
