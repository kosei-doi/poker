import { ChatPanel } from './components/chat/ChatPanel';
import { ConditionTags } from './components/conditions/ConditionTags';
import { Header } from './components/Header';
import { SpotlightMap } from './components/map/SpotlightMap';
import { NarrowingLog } from './components/recommend/NarrowingLog';
import { RecommendationList } from './components/recommend/RecommendationList';
import { ReportModal } from './components/report/ReportModal';
import { TownPanel } from './components/town/TownPanel';
import { VoiceModal } from './components/voice/VoiceModal';
import { AppStateProvider } from './state/AppStateProvider';
import { useEffect, useRef } from 'react';
import { useApp } from './state/context';

function Panel() {
  const { state } = useApp();
  if (state.selectedTownId) return <TownPanel townId={state.selectedTownId} />;
  return (
    <div className="space-y-5">
      <ChatPanel />
      <ConditionTags />
      <NarrowingLog />
      <RecommendationList />
    </div>
  );
}

function Layout() {
  const { state } = useApp();
  const asideRef = useRef<HTMLElement>(null);
  // 町を選んだとき・戻ったときはパネルを先頭から見せる
  useEffect(() => {
    asideRef.current?.scrollTo({ top: 0 });
  }, [state.selectedTownId]);
  return (
    <div className="h-full flex flex-col">
      <Header />
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row-reverse">
        <div className="h-[50vh] lg:h-auto lg:flex-1 shrink-0 border-b lg:border-b-0 lg:border-l border-line">
          <SpotlightMap />
        </div>
        <aside ref={asideRef} className="flex-1 lg:flex-none lg:w-[420px] min-h-0 overflow-y-auto bg-panel px-4 py-4" aria-label="操作パネル">
          <Panel />
          <p className="mt-8 text-[11px] text-muted leading-relaxed">
            感想・費用・所要時間はサンプル（架空または目安）です。境界データは国土数値情報（行政区域データ）を加工して作成。
          </p>
        </aside>
      </main>
      <VoiceModal />
      <ReportModal />
    </div>
  );
}

export function App() {
  return (
    <AppStateProvider>
      <Layout />
    </AppStateProvider>
  );
}
