import { useState } from 'react';
import { Shell, type TabKey } from './components/Shell';
import { SearchView } from './components/SearchView';
import { EventsView } from './components/EventsView';
import { MatchView } from './components/MatchView';
import { PlanView } from './components/PlanView';
import { TracesView } from './components/TracesView';
import { RegionSheet } from './components/RegionSheet';
import { AddVoiceModal, PostEventModal } from './components/PostModals';
import { REGIONS } from './data/regions';
import type { Region, Filters, Voice, Place } from './types';

const DEFAULT_FILTERS: Filters = { maxMinutes: 240, maxBudget: 15000, withWhom: 'any', vibe: 'any' };

export function App() {
  const [regions, setRegions] = useState<Region[]>(REGIONS);
  const [tab, setTab] = useState<TabKey>('search');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sheet, setSheet] = useState<Region | null>(null);
  const [current, setCurrent] = useState<string>(REGIONS[0].id);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const goPlan = (id: string) => { setCurrent(id); setTab('plan'); };
  const goTraces = (id: string) => { setCurrent(id); setTab('traces'); };

  const addVoice = (regionId: string, v: Voice) => {
    setRegions((prev) => prev.map((r) => (r.id === regionId ? { ...r, voices: [v, ...r.voices] } : r)));
    setCurrent(regionId);
    notify('記録を残しました。次に迷う人の判断材料になります');
  };

  const addPlace = (regionId: string, p: Place) => {
    setRegions((prev) => prev.map((r) => (r.id === regionId ? { ...r, places: [...r.places, p] } : r)));
    notify(`「${p.name}」を載せました`);
  };

  return (
    <Shell tab={tab} onTab={setTab} onAddVoice={() => setVoiceOpen(true)}>
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-amber-400 text-[#0E1013] text-xs font-bold px-4 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}

      {tab === 'search' && (
        <SearchView regions={regions} filters={filters} onFilters={setFilters} onOpen={setSheet} />
      )}
      {tab === 'events' && (
        <EventsView regions={regions} onPlan={goPlan} onOpenPost={() => setPostOpen(true)} />
      )}
      {tab === 'match' && <MatchView regions={regions} onOpen={setSheet} />}
      {tab === 'plan' && <PlanView regions={regions} selectedId={current} onSelect={setCurrent} />}
      {tab === 'traces' && (
        <TracesView regions={regions} selectedId={current} onSelect={setCurrent}
          onAddVoice={() => setVoiceOpen(true)} />
      )}

      <RegionSheet region={sheet} onClose={() => setSheet(null)} onPlan={goPlan} onTraces={goTraces} />
      <AddVoiceModal regions={regions} open={voiceOpen} onClose={() => setVoiceOpen(false)} onAdd={addVoice} />
      <PostEventModal regions={regions} open={postOpen} onClose={() => setPostOpen(false)} onAdd={addPlace} />
    </Shell>
  );
}

export default App;
