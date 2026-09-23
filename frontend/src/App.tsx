import { useState } from 'react';
import type { EventItem, Footprint } from './types';
import { INITIAL_EVENTS } from './data/mockData';
import { Navbar } from './components/Navbar';
import { EventListView } from './components/EventListView';
import { EventMapView } from './components/EventMapView';
import { TourPlannerView } from './components/TourPlannerView';
import { EventMatchFinder } from './components/EventMatchFinder';
import { EventDetailModal } from './components/EventDetailModal';
import { EventPostModal } from './components/EventPostModal';
import { AddFootprintModal } from './components/AddFootprintModal';
import { Heart, Sparkles } from 'lucide-react';

export function App() {
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [activeTab, setActiveTab] = useState<'events' | 'matching' | 'map' | 'planner'>('events');

  // Modals state
  const [detailModalEvent, setDetailModalEvent] = useState<EventItem | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [footprintModalEvent, setFootprintModalEvent] = useState<EventItem | null>(null);

  // Selected event for focusing on Map or Planner
  const [selectedEventForMap, setSelectedEventForMap] = useState<EventItem | null>(null);
  const [plannerBaseEventId, setPlannerBaseEventId] = useState<string | undefined>(undefined);

  // Success toast/notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add new event
  const handleAddEvent = (newEvent: EventItem) => {
    setEvents((prev) => [newEvent, ...prev]);
    showToast(`催し「${newEvent.title}」を公開しました！`);
  };

  // Add new footprint
  const handleAddFootprint = (eventId: string, newFootprint: Footprint) => {
    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id === eventId) {
          return {
            ...evt,
            footprints: [...evt.footprints, newFootprint],
          };
        }
        return evt;
      })
    );
    // Also update detail modal event if currently viewing
    if (detailModalEvent && detailModalEvent.id === eventId) {
      setDetailModalEvent((prev) =>
        prev
          ? {
              ...prev,
              footprints: [...prev.footprints, newFootprint],
            }
          : null
      );
    }
    showToast(`足跡を投稿しました！ありがとうございます👣`);
  };

  // Switch to Map and focus on specific event
  const handleViewOnMap = (event: EventItem) => {
    setSelectedEventForMap(event);
    setActiveTab('map');
  };

  // Switch to Planner with specific event
  const handlePlanTripWithEvent = (event: EventItem) => {
    setPlannerBaseEventId(event.id);
    setActiveTab('planner');
  };

  const totalFootprints = events.reduce((acc, curr) => acc + curr.footprints.length, 0);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-stone-900/90 text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border border-stone-700 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPostModal={() => setIsPostModalOpen(true)}
        eventCount={events.length}
        totalFootprints={totalFootprints}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-20 md:pb-8">
        {activeTab === 'events' && (
          <EventListView
            events={events}
            onSelectEvent={(evt) => setDetailModalEvent(evt)}
            onViewOnMap={handleViewOnMap}
            onAddFootprint={(evt) => setFootprintModalEvent(evt)}
            onGoToPlanner={() => setActiveTab('planner')}
            onGoToMatching={() => setActiveTab('matching')}
          />
        )}

        {activeTab === 'matching' && (
          <div className="pb-16">
            <EventMatchFinder
              events={events}
              onSelectEvent={(evt) => setDetailModalEvent(evt)}
              onViewOnMap={handleViewOnMap}
              onPlanTrip={handlePlanTripWithEvent}
            />
          </div>
        )}

        {activeTab === 'map' && (
          <EventMapView
            events={events}
            selectedEventForMap={selectedEventForMap}
            onSelectEvent={(evt) => setDetailModalEvent(evt)}
            onOpenAddFootprint={(evt) => setFootprintModalEvent(evt)}
            onPlanTrip={handlePlanTripWithEvent}
          />
        )}

        {activeTab === 'planner' && (
          <TourPlannerView
            events={events}
            initialSelectedEventId={plannerBaseEventId}
            onSelectEvent={(evt) => setDetailModalEvent(evt)}
          />
        )}
      </main>

      {/* Footer (Hidden on Map tab) */}
      {activeTab !== 'map' && (
        <footer className="bg-stone-900 text-stone-400 border-t border-stone-800 pt-8 pb-24 md:py-10 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-white font-extrabold text-lg mb-1">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-xs">
                    🌱
                  </span>
                  <span>めぐりまち - MeguriMachi</span>
                </div>
                <p className="text-xs text-stone-400 max-w-md leading-relaxed">
                  地域のあたたかい催しと旅人の足跡を可視化し、持続的な地域周遊と関係人口の創出を加速する地域創生プラットフォーム。
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-xs">
                <span className="hover:text-stone-200 cursor-pointer" onClick={() => setActiveTab('events')}>
                  催し一覧
                </span>
                <span className="hover:text-stone-200 cursor-pointer" onClick={() => setActiveTab('matching')}>
                  ぴったり診断
                </span>
                <span className="hover:text-stone-200 cursor-pointer" onClick={() => setActiveTab('map')}>
                  足跡マップ
                </span>
                <span className="hover:text-stone-200 cursor-pointer" onClick={() => setActiveTab('planner')}>
                  周遊プラン
                </span>
                <span
                  className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                  onClick={() => setIsPostModalOpen(true)}
                >
                  + 催しを投稿
                </span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-stone-800 text-center text-xs text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>© 2026 めぐりまち プロジェクト (Hackathon Edition)</span>
              <span className="flex items-center gap-1">
                Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Local Revitalization
              </span>
            </div>
          </div>
        </footer>
      )}

      {/* Modals */}
      <EventDetailModal
        event={detailModalEvent}
        onClose={() => setDetailModalEvent(null)}
        onViewOnMap={handleViewOnMap}
        onOpenAddFootprint={(evt) => setFootprintModalEvent(evt)}
        onPlanTripWithEvent={handlePlanTripWithEvent}
      />

      <EventPostModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onAddEvent={handleAddEvent}
      />

      <AddFootprintModal
        event={footprintModalEvent}
        isOpen={!!footprintModalEvent}
        onClose={() => setFootprintModalEvent(null)}
        onAddFootprint={handleAddFootprint}
      />
    </div>
  );
}

export default App;
