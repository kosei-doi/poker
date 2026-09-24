import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { SHOWCASE_INTERVAL_MS } from '../../lib/showcase';
import type { Tag } from '../../types';

interface Props {
  tags: Tag[];
  currentTag: Tag | null;
  onSelectTag: (tag: Tag) => void;
  onPrev: () => void;
  onNext: () => void;
  /** 一時停止ボタンの状態 */
  paused: boolean;
  onTogglePause: () => void;
  /** マウス・フォーカスで止まっているとき */
  holdReason: 'hover' | 'focus' | null;
}

function statusText(paused: boolean, holdReason: Props['holdReason']): string {
  if (paused) return '一時停止中';
  if (holdReason === 'hover') return 'マウスが乗っているあいだ止めています';
  if (holdReason === 'focus') return 'フォーカスがあるあいだ止めています';
  return `自動で切り替え中（${SHOWCASE_INTERVAL_MS / 1000}秒ごと）`;
}

const ICON_BUTTON =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-panel-2 hover:border-glow';

/** ダッシュボードの操作（N7-4・N7-6）: 前へ・次へ・一時停止/再生・状態・タグの一覧 */
export function ShowcaseControls({ tags, currentTag, onSelectTag, onPrev, onNext, paused, onTogglePause, holdReason }: Props) {
  return (
    <div className="min-w-0 space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onPrev} className={ICON_BUTTON} aria-label="前のタグへ">
          <ChevronLeft size={18} aria-hidden />
        </button>
        <button
          type="button"
          onClick={onTogglePause}
          aria-pressed={paused}
          aria-label={paused ? '再生' : '一時停止'}
          className={`${ICON_BUTTON} ${paused ? 'border-glow text-glow' : ''}`}
        >
          {paused ? <Play size={16} aria-hidden /> : <Pause size={16} aria-hidden />}
        </button>
        <button type="button" onClick={onNext} className={ICON_BUTTON} aria-label="次のタグへ">
          <ChevronRight size={18} aria-hidden />
        </button>
        <p className="min-w-0 text-xs text-muted" aria-live="polite">
          {statusText(paused, holdReason)}
        </p>
      </div>

      <ul className="flex flex-wrap gap-1.5" aria-label="タグの一覧">
        {tags.map((t) => {
          const active = t === currentTag;
          return (
            <li key={t}>
              <button
                type="button"
                onClick={() => onSelectTag(t)}
                aria-current={active ? 'true' : undefined}
                className={`rounded-full border px-3 py-1 text-xs ${active ? 'border-glow bg-glow text-[#1c1300] font-bold' : 'border-line bg-panel-2 hover:border-glow'}`}
              >
                #{t}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
