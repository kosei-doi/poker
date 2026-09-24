import React from 'react';
import { Compass, Footprints, PlusCircle, Search, Sparkles } from 'lucide-react';

export type TabKey = 'discover' | 'map' | 'planner';

interface NavbarProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  onOpenPostModal: () => void;
  spotCount: number;
  totalFootprints: number;
}

const TABS: { key: TabKey; label: string; icon: React.ReactNode; active: string }[] = [
  { key: 'discover', label: '穴場を探す', icon: <Search className="w-4 h-4" />, active: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { key: 'map', label: '足跡マップ', icon: <Footprints className="w-4 h-4" />, active: 'bg-amber-50 text-amber-800 border-amber-300' },
  { key: 'planner', label: 'AI旅プラン', icon: <Sparkles className="w-4 h-4" />, active: 'bg-violet-50 text-violet-800 border-violet-200' },
];

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenPostModal, spotCount, totalFootprints }) => {
  const counter = (key: TabKey) =>
    key === 'discover' ? spotCount : key === 'map' ? `👣 ${totalFootprints}` : 'AI';

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 sm:h-16">
          <button className="flex items-center gap-2 sm:gap-3 shrink-0" onClick={() => setActiveTab('discover')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-amber-500 flex items-center justify-center text-white shadow-md">
              <Compass className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-xl tracking-tight text-stone-900">めぐりまち</span>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                  地域創生
                </span>
              </div>
              <p className="text-[10px] text-stone-500 hidden md:block">地元の人が教える穴場と、旅人の足跡でつくる地図</p>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1.5">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  activeTab === t.key ? t.active : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
                <span className="ml-0.5 text-[11px] px-1.5 bg-stone-100 text-stone-600 rounded-full">{counter(t.key)}</span>
              </button>
            ))}
          </nav>

          <button
            onClick={onOpenPostModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">穴場を投稿</span>
            <span className="sm:hidden">投稿</span>
          </button>
        </div>
      </header>

      {/* スマホ用の下部ナビ */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200 px-2 py-1.5 flex justify-around">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex flex-col items-center py-1 px-4 rounded-xl ${
              activeTab === t.key ? `${t.active} font-bold` : 'text-stone-500'
            }`}
          >
            {t.icon}
            <span className="text-[10px] mt-0.5">{t.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
};
