import { useEffect, useLayoutEffect, useRef } from 'react';
import { ChatComposer, ChatMessages } from '../components/chat/ChatPanel';
import { ConditionTags } from '../components/conditions/ConditionTags';
import { SpotlightMap } from '../components/map/SpotlightMap';
import { NarrowingLog } from '../components/recommend/NarrowingLog';
import { RecommendationList } from '../components/recommend/RecommendationList';
import { TownPanel } from '../components/town/TownPanel';
import { TOWNS } from '../data/towns';
import { useApp } from '../state/context';
import { navigate, useRoute } from '../state/useRoute';

/** 下端からこの距離（px）以内にいるときだけ、新しい内容に追従してスクロールする（B1） */
const FOLLOW_THRESHOLD = 80;

function SampleNote() {
  return (
    <p className="mt-8 text-[11px] text-muted leading-relaxed">
      感想・費用・所要時間はサンプル（架空または目安）です。境界データは国土数値情報（行政区域データ）を加工して作成。
    </p>
  );
}

/**
 * ?town= と選んだ町を合わせる（設計 13.5）。
 * URL の町が変わったら町を選び、選んだ町が変わったら URL を書き換える（replace）。どちらも今の値と違うときだけ。
 */
function useTownParamSync() {
  const { state, dispatch } = useApp();
  const route = useRoute();
  const routeTown = route.page === 'search' ? route.town : null;
  const selected = state.selectedTownId;
  const prevRouteTown = useRef<string | null | undefined>(undefined);
  const prevSelected = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const mounted = prevRouteTown.current !== undefined;
    const routeChanged = prevRouteTown.current !== routeTown;
    const selectedChanged = prevSelected.current !== selected;
    prevRouteTown.current = routeTown;
    prevSelected.current = selected;
    if (routeTown === selected) return;

    // URL → 状態（一覧から開いたとき・直打ち・再読み込み）
    if (routeChanged && routeTown) {
      if (state.summaries[routeTown]) {
        dispatch({ type: 'SELECT_TOWN', townId: routeTown });
      } else if (TOWNS.some((t) => t.id === routeTown)) {
        // 声のない町は選べないので、県北を見せて「まだ声が集まっていません」を出す
        dispatch({ type: 'SET_MAP_VIEW', view: 'kenpoku' });
        dispatch({ type: 'SHOW_NO_VOICE', townId: routeTown });
        navigate({ page: 'search', town: null }, { replace: true });
      }
      return;
    }
    // 状態 → URL（初めて開いたときは、残っている選択を URL に反映する）
    if (selectedChanged || !mounted) {
      navigate({ page: 'search', town: selected }, { replace: true });
    }
  }, [routeTown, selected, state.summaries, dispatch]);
}

/** さがす（D1〜D5・B1〜B4・N1） */
export function SearchPage() {
  const { state } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  useTownParamSync();

  // 町を選んだとき・戻ったときはパネルを先頭から見せる
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    nearBottom.current = state.selectedTownId === null;
  }, [state.selectedTownId]);

  // 新しい発言・条件・理由・提案が出たら、下端にいるときだけ一番下へ（B1）
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || state.selectedTownId || !nearBottom.current) return;
    el.scrollTop = el.scrollHeight;
  }, [
    state.messages.length,
    state.consultPhase,
    state.conditions,
    state.narrowingLog.length,
    state.lit,
    state.showEmpty,
    state.selectedTownId,
  ]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight <= FOLLOW_THRESHOLD;
  };

  return (
    <main className="flex-1 min-h-0 flex flex-col lg:flex-row-reverse">
      <div className="h-[50vh] lg:h-auto lg:flex-1 shrink-0 border-b lg:border-b-0 lg:border-l border-line">
        <SpotlightMap />
      </div>
      <aside className="flex-1 lg:flex-none lg:w-[420px] min-h-0 flex flex-col bg-panel" aria-label="操作パネル">
        <div ref={scrollRef} onScroll={onScroll} className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
          {state.selectedTownId ? (
            <TownPanel townId={state.selectedTownId} />
          ) : (
            <div className="space-y-5">
              <ChatMessages />
              <ConditionTags />
              <NarrowingLog />
              <RecommendationList />
            </div>
          )}
          <SampleNote />
        </div>
        {!state.selectedTownId && (
          <div className="shrink-0 border-t border-line bg-panel px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <ChatComposer
              onSent={() => {
                nearBottom.current = true;
              }}
            />
          </div>
        )}
      </aside>
    </main>
  );
}
