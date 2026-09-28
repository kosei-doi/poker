import React from 'react';
import { Telescope, Plus } from 'lucide-react';

export type TabKey = 'search' | 'events' | 'match' | 'plan' | 'traces';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'search', label: 'さがす' },
  { key: 'events', label: '催し' },
  { key: 'match', label: '相性で選ぶ' },
  { key: 'plan', label: '1日プラン' },
  { key: 'traces', label: '行った人' },
];

interface Props {
  tab: TabKey;
  onTab: (t: TabKey) => void;
  onAddVoice: () => void;
  children: React.ReactNode;
}

export const Shell: React.FC<Props> = ({ tab, onTab, onAddVoice, children }) => (
  <div className="min-h-screen flex flex-col bg-[#0E1013] text-stone-100">
    <header className="sticky top-0 z-30 bg-[#0E1013]/90 backdrop-blur border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <button onClick={() => onTab('search')} className="flex items-center gap-2 shrink-0">
          <span className="w-8 h-8 rounded-lg bg-amber-400 text-[#0E1013] grid place-items-center">
            <Telescope className="w-4 h-4" />
          </span>
          <span className="text-left leading-none">
            <span className="block font-extrabold tracking-[0.18em] text-sm">ANABA</span>
            <span className="block text-[10px] text-stone-400 mt-0.5">穴場なのに、失敗しない</span>
          </span>
        </button>

        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => onTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                tab === t.key
                  ? 'bg-amber-400 text-[#0E1013]'
                  : 'text-stone-400 hover:text-stone-100 hover:bg-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
          <button onClick={onAddVoice}
            className="ml-1 shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-white/15 text-stone-300 hover:bg-white/5">
            <Plus className="w-3.5 h-3.5" /><span className="hidden sm:inline">記録</span>
          </button>
        </nav>
      </div>
    </header>

    <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">{children}</main>

    <footer className="border-t border-white/10 mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-7 text-xs text-stone-500 leading-relaxed">
        <p className="text-stone-300 font-bold mb-1.5">ANABA</p>
        <p className="max-w-xl">
          友達との旅行で行き先を決める役になった人へ。穴場を編集部が選ぶのではなく
          <span className="text-stone-300">満足度 − 知名度</span>
          で計算して並べ、行った人の記録と1日分の計画、そして誘い文句まで渡します。
        </p>
        <p className="mt-3 text-stone-600">HACK STAGE S3 ／ チーム ポーカー ／ プロトタイプ</p>
      </div>
    </footer>
  </div>
);
