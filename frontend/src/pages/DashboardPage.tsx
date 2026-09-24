import { MessageCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type FocusEvent } from 'react';
import { DashboardMap } from '../components/dashboard/DashboardMap';
import { ShowcaseControls } from '../components/dashboard/ShowcaseControls';
import { ShowcaseList } from '../components/dashboard/ShowcaseList';
import { toHash } from '../lib/route';
import { SHOWCASE_INTERVAL_MS, showcaseRows, showcaseTags, stepIndex, type ShowcaseRow } from '../lib/showcase';
import { useSnapshot } from '../state/selectors';
import { navigate } from '../state/useRoute';
import type { Tag, TownId } from '../types';

/** 表示中のタグと行。切り替えた時点のデータで固定する（N7-7: 新しい値は次の切り替えから） */
interface Shown {
  tag: Tag;
  rows: ShowcaseRow[];
}

/** ダッシュボード（N7）。最初に開く画面。タグごとに穴場の町を光らせ、6秒ごとに次のタグへ */
export function DashboardPage() {
  const snap = useSnapshot();
  const snapRef = useRef(snap);
  snapRef.current = snap;
  const tags = useMemo(() => showcaseTags(snap.summaries), [snap.summaries]);
  const tagsRef = useRef(tags);
  tagsRef.current = tags;

  const [shown, setShown] = useState<Shown | null>(() =>
    tags.length > 0 ? { tag: tags[0], rows: showcaseRows(tags[0], snap) } : null,
  );
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [switchCount, setSwitchCount] = useState(0);

  const show = useCallback((tag: Tag) => {
    setShown({ tag, rows: showcaseRows(tag, snapRef.current) });
    setSwitchCount((n) => n + 1);
  }, []);

  const step = useCallback(
    (dir: 1 | -1) => {
      const list = tagsRef.current;
      if (list.length === 0) return;
      // 今のタグが一覧から消えていたら最初のタグへ
      const i = shown ? list.indexOf(shown.tag) : -1;
      show(i < 0 ? list[0] : list[stepIndex(i, list.length, dir)]);
    },
    [shown, show],
  );

  // タグの一覧が空から増えたときなどは最初のタグを出す
  useEffect(() => {
    if (!shown && tags.length > 0) show(tags[0]);
  }, [shown, tags, show]);

  // 自動の切り替え。止める条件（一時停止・マウス・フォーカス）がなくなったら、そこから改めて6秒数える
  const holding = paused || hover || focusWithin;
  useEffect(() => {
    if (holding || !shown) return;
    const timer = setTimeout(() => step(1), SHOWCASE_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [holding, shown, switchCount, step]);

  const openTown = (townId: TownId) => navigate({ page: 'search', town: townId });

  const holdHandlers = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    onFocus: () => setFocusWithin(true),
    onBlur: (e: FocusEvent<HTMLElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusWithin(false);
    },
  };
  const holdReason: 'hover' | 'focus' | null = paused ? null : hover ? 'hover' : focusWithin ? 'focus' : null;

  return (
    <main className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden flex flex-col">
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-line space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted">特徴のタグごとの穴場の町</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-glow leading-tight" aria-live="polite">
              {shown ? `#${shown.tag} の穴場` : '穴場の町'}
            </h1>
          </div>
          <a
            href={toHash({ page: 'search', town: null })}
            className="inline-flex items-center gap-2 rounded-xl bg-glow text-[#1c1300] font-bold px-4 py-2 text-sm"
          >
            <MessageCircle size={16} aria-hidden />
            さがすで相談する
          </a>
        </div>
        <ShowcaseControls
          tags={tags}
          currentTag={shown?.tag ?? null}
          onSelectTag={show}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          paused={paused}
          onTogglePause={() => setPaused((p) => !p)}
          holdReason={holdReason}
        />
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <section
          aria-label="地図"
          className="h-[40vh] lg:h-auto lg:flex-1 shrink-0 border-b lg:border-b-0 lg:border-r border-line"
          {...holdHandlers}
        >
          <DashboardMap
            litTownIds={shown?.rows.map((r) => r.town.id) ?? []}
            onSelectTown={openTown}
            label={shown ? `#${shown.tag} の穴場の町の地図` : '県北の地図'}
          />
        </section>
        <section
          aria-label="穴場の町のリスト"
          className="lg:w-[440px] lg:shrink-0 lg:overflow-y-auto bg-panel px-4 py-4"
          {...holdHandlers}
        >
          {shown ? (
            <ShowcaseList key={`${shown.tag}-${switchCount}`} tag={shown.tag} rows={shown.rows} onSelectTown={openTown} />
          ) : (
            <p className="text-sm text-muted">まだ町のタグがありません</p>
          )}
          <p className="mt-6 text-[11px] text-muted">感想・費用・所要時間はサンプル（架空または目安）です。</p>
        </section>
      </div>
    </main>
  );
}
