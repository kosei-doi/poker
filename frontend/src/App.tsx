import { Header } from './components/Header';
import { VoiceModal } from './components/voice/VoiceModal';
import { AboutPage } from './pages/AboutPage';
import { DashboardPage } from './pages/DashboardPage';
import { PartnerPage } from './pages/PartnerPage';
import { SearchPage } from './pages/SearchPage';
import { AppStateProvider } from './state/AppStateProvider';
import { normalizeHash, useRoute } from './state/useRoute';

// 起動時にハッシュを正規形にする（再読み込みで同じページが開く。N2-2）
normalizeHash();

function Shell() {
  const route = useRoute();
  return (
    <div className="h-full flex flex-col">
      <Header />
      {route.page === 'search' && <SearchPage />}
      {route.page === 'dashboard' && <DashboardPage />}
      {route.page === 'partner' && <PartnerPage />}
      {route.page === 'about' && <AboutPage />}
      <VoiceModal />
    </div>
  );
}

/** ルーターは AppStateProvider の中に置く。ページを移っても状態は残る（設計 決定#13） */
export function App() {
  return (
    <AppStateProvider>
      <Shell />
    </AppStateProvider>
  );
}
