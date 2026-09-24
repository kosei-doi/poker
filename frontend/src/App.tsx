import { useEffect, useState } from 'react';
import { Heart, Sparkles } from 'lucide-react';
import type { Footprint, Spot } from './types';
import { INITIAL_SPOTS } from './data/mockData';
import { Navbar, type TabKey } from './components/Navbar';
import { SpotListView } from './components/SpotListView';
import { FootprintMapView } from './components/FootprintMapView';
import { AiPlannerView } from './components/AiPlannerView';
import { SpotDetailModal } from './components/SpotDetailModal';
import { SpotPostModal } from './components/SpotPostModal';
import { AddFootprintModal } from './components/AddFootprintModal';

const STORAGE_KEY = 'meguri:spots:v1';

// デモ中に投稿したスポット・足跡をリロードしても残すため、ブラウザに保存する
function loadSpots(): Spot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Spot[];
  } catch {
    // 保存データが読めなければ初期データで始める
  }
  return INITIAL_SPOTS;
}

export function App() {
  const [spots, setSpots] = useState<Spot[]>(loadSpots);
  const [activeTab, setActiveTab] = useState<TabKey>('discover');

  const [detailSpotId, setDetailSpotId] = useState<string | null>(null);
  const [footprintSpotId, setFootprintSpotId] = useState<string | null>(null);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [mapFocus, setMapFocus] = useState<Spot | null>(null);
  const [plannerSpot, setPlannerSpot] = useState<Spot | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(spots));
    } catch {
      // 保存できなくても画面はそのまま使える
    }
  }, [spots]);

  // モーダルは id で持ち、足跡追加後も最新のスポットを表示する
  const detailSpot = spots.find((s) => s.id === detailSpotId) ?? null;
  const footprintSpot = spots.find((s) => s.id === footprintSpotId) ?? null;
  const totalFootprints = spots.reduce((acc, s) => acc + s.footprints.length, 0);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddSpot = (spot: Spot) => {
    setSpots((prev) => [spot, ...prev]);
    showToast(`「${spot.name}」を公開しました！`);
    setDetailSpotId(spot.id);
  };

  const handleAddFootprint = (spotId: string, fp: Footprint) => {
    setSpots((prev) => prev.map((s) => (s.id === spotId ? { ...s, footprints: [...s.footprints, fp] } : s)));
    showToast('足跡を残しました 👣');
  };

  const goTab = (tab: TabKey) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0 });
  };

  const viewOnMap = (spot: Spot) => {
    setDetailSpotId(null);
    setMapFocus(spot);
    goTab('map');
  };

  const planWithSpot = (spot: Spot) => {
    setDetailSpotId(null);
    setPlannerSpot(spot);
    goTab('planner');
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      {toast && (
        <div className="fixed top-20 right-4 z-[60] bg-stone-900/90 text-white text-sm font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          {toast}
        </div>
      )}

      <Navbar
        activeTab={activeTab}
        setActiveTab={goTab}
        onOpenPostModal={() => setIsPostOpen(true)}
        spotCount={spots.length}
        totalFootprints={totalFootprints}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-24 md:pb-10">
        {activeTab === 'discover' && (
          <SpotListView
            spots={spots}
            onSelectSpot={(s) => setDetailSpotId(s.id)}
            onOpenPost={() => setIsPostOpen(true)}
            onGoToPlanner={() => goTab('planner')}
          />
        )}
        {activeTab === 'map' && (
          <FootprintMapView
            key={mapFocus?.id ?? 'all'}
            spots={spots}
            focusSpot={mapFocus}
            onSelectSpot={(s) => setDetailSpotId(s.id)}
            onAddFootprint={(s) => setFootprintSpotId(s.id)}
          />
        )}
        {activeTab === 'planner' && (
          <AiPlannerView
            key={plannerSpot?.id ?? 'free'}
            spots={spots}
            initialSpot={plannerSpot}
            onSelectSpot={(s) => setDetailSpotId(s.id)}
          />
        )}
      </main>

      <footer className="bg-stone-900 text-stone-400 pt-8 pb-24 md:py-8 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <p className="text-white font-extrabold text-base mb-1">🌱 めぐりまち</p>
            <p className="max-w-md leading-relaxed">
              地元の人が教える穴場と、旅人・地域の人の足跡をつなぎ、関係人口と地域の小さな経済を育てる地域創生プラットフォーム。
            </p>
          </div>
          <p className="flex items-center gap-1 self-end">
            Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Local Revitalization — Hackathon Edition
          </p>
        </div>
      </footer>

      <SpotDetailModal
        spot={detailSpot}
        onClose={() => setDetailSpotId(null)}
        onAddFootprint={(s) => setFootprintSpotId(s.id)}
        onViewOnMap={viewOnMap}
        onPlanWithSpot={planWithSpot}
      />
      <SpotPostModal open={isPostOpen} onClose={() => setIsPostOpen(false)} onAdd={handleAddSpot} />
      <AddFootprintModal
        key={footprintSpotId ?? 'none'}
        spot={footprintSpot}
        onClose={() => setFootprintSpotId(null)}
        onAdd={handleAddFootprint}
      />
    </div>
  );
}

export default App;
