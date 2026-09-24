import React, { useMemo, useState } from 'react';
import { PlusCircle, Search, Sparkles } from 'lucide-react';
import type { Spot, SpotCategory } from '../types';
import { AREAS } from '../data/mockData';
import { CATEGORY_KEYS, CATEGORY_MAP } from '../utils/categoryHelpers';
import { countFootprints, hiddenGemScore } from '../utils/spotStats';
import { SpotCard } from './SpotCard';

type SortKey = 'gem' | 'new' | 'popular';

interface SpotListViewProps {
  spots: Spot[];
  onSelectSpot: (spot: Spot) => void;
  onOpenPost: () => void;
  onGoToPlanner: () => void;
}

export const SpotListView: React.FC<SpotListViewProps> = ({ spots, onSelectSpot, onOpenPost, onGoToPlanner }) => {
  const [query, setQuery] = useState('');
  const [area, setArea] = useState<string>('すべて');
  const [category, setCategory] = useState<SpotCategory | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('gem');

  const filtered = useMemo(() => {
    const q = query.trim();
    const list = spots.filter(
      (s) =>
        (area === 'すべて' || s.area === area) &&
        (category === 'all' || s.category === category) &&
        (!q || [s.name, s.catchphrase, s.description, ...s.tags].some((t) => t.includes(q))),
    );
    const sorters: Record<SortKey, (a: Spot, b: Spot) => number> = {
      gem: (a, b) => hiddenGemScore(b) - hiddenGemScore(a),
      new: (a, b) => b.postedAt.localeCompare(a.postedAt),
      popular: (a, b) => b.footprints.length - a.footprints.length,
    };
    return list.sort(sorters[sort]);
  }, [spots, query, area, category, sort]);

  const localAuthors = new Set(spots.map((s) => s.author.name)).size;
  const totals = spots.reduce(
    (acc, s) => {
      const c = countFootprints(s);
      return { local: acc.local + c.local, visitor: acc.visitor + c.visitor };
    },
    { local: 0, visitor: 0 },
  );

  return (
    <div className="space-y-6">
      {/* ヒーロー */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-teal-700 to-emerald-900 text-white p-6 sm:p-10">
        <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-bold tracking-widest text-emerald-200 mb-2">LOCAL HIDDEN GEMS</p>
          <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight">
            ガイドブックに載らない、
            <br />
            地元の人の「いつもの場所」へ。
          </h1>
          <p className="mt-3 text-sm text-emerald-50/90 leading-relaxed">
            地域の人が投稿した穴場スポットを、AIがあなた好みの旅プランに。訪れたら足跡を残して、次の旅人と地域をつなぎましょう。
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={onGoToPlanner}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-bold text-sm shadow-lg hover:bg-emerald-50"
            >
              <Sparkles className="w-4 h-4 text-violet-600" />
              AIに旅プランを作ってもらう
            </button>
            <button
              onClick={onOpenPost}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-300/40 font-bold text-sm hover:bg-emerald-950/60"
            >
              <PlusCircle className="w-4 h-4" />
              地元の穴場を教える
            </button>
          </div>
        </div>
        <dl className="relative mt-8 grid grid-cols-3 gap-3 max-w-lg">
          {[
            ['穴場スポット', spots.length],
            ['投稿した地元の人', localAuthors],
            ['足跡（地元 / 旅人）', `${totals.local} / ${totals.visitor}`],
          ].map(([label, value]) => (
            <div key={label} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <dt className="text-[10px] text-emerald-100">{label}</dt>
              <dd className="text-lg sm:text-xl font-extrabold">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 絞り込み */}
      <section className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="flex-1 flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="キーワード（例：朝市、夕日、そば）"
              className="flex-1 bg-transparent text-sm focus:outline-hidden"
            />
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm font-semibold text-stone-700"
          >
            <option value="gem">💎 穴場度が高い順</option>
            <option value="new">🆕 新着順</option>
            <option value="popular">👣 足跡が多い順</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['すべて', ...AREAS].map((a) => (
            <Chip key={a} active={area === a} onClick={() => setArea(a)}>
              📍 {a}
            </Chip>
          ))}
          <span className="w-px bg-stone-200 mx-1" />
          <Chip active={category === 'all'} onClick={() => setCategory('all')}>
            すべて
          </Chip>
          {CATEGORY_KEYS.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
              {CATEGORY_MAP[c].emoji} {CATEGORY_MAP[c].label}
            </Chip>
          ))}
        </div>
      </section>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-stone-500 py-16">条件に合う穴場が見つかりませんでした。</p>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map((s) => (
            <SpotCard key={s.id} spot={s} onSelect={onSelectSpot} />
          ))}
        </section>
      )}
    </div>
  );
};

const Chip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
      active ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
    }`}
  >
    {children}
  </button>
);
