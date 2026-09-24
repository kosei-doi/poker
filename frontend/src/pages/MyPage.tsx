import { useMemo } from 'react';
import { EmptyGuide } from '../components/mypage/EmptyGuide';
import { FavoriteTownList } from '../components/mypage/FavoriteTownList';
import { MyVoiceList } from '../components/mypage/MyVoiceList';
import { SummaryStats } from '../components/mypage/SummaryStats';
import { VisitedTownList } from '../components/mypage/VisitedTownList';
import { buildMyVoices, buildSummary, buildVisitedTowns } from '../lib/mypage';
import { useApp } from '../state/context';
import { useSnapshot } from '../state/selectors';

/** マイページ（N3） */
export function MyPage() {
  const { state } = useApp();
  const snap = useSnapshot();
  const { userVoices, favorites, postedSpots } = state;

  const myVoices = useMemo(() => buildMyVoices(userVoices, postedSpots), [userVoices, postedSpots]);
  const visited = useMemo(
    () => buildVisitedTowns(userVoices, postedSpots, snap.stats),
    [userVoices, postedSpots, snap.stats],
  );
  const summary = useMemo(
    () => buildSummary(userVoices, favorites, postedSpots),
    [userVoices, favorites, postedSpots],
  );
  const empty = summary.voices === 0 && summary.favorites === 0;

  return (
    <main className="flex-1 min-h-0 overflow-y-auto">
      <div className="mx-auto w-full max-w-[960px] px-4 py-6 space-y-5">
        <h1 className="text-xl font-extrabold">マイページ</h1>
        <SummaryStats summary={summary} />
        {empty ? (
          <EmptyGuide />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 md:items-start">
            <MyVoiceList rows={myVoices} />
            <div className="space-y-6">
              <VisitedTownList rows={visited} stats={snap.stats} />
              <FavoriteTownList favorites={favorites} stats={snap.stats} summaries={snap.summaries} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
