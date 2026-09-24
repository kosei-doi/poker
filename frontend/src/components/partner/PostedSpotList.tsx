import { Clock, Megaphone, Trash2, Wallet } from 'lucide-react';
import { useState } from 'react';
import { minutes, yen } from '../../lib/format';
import { useApp } from '../../state/context';
import type { SpotId, TownId } from '../../types';
import { KIND_ICON } from './PostPhotoPicker';

function dateTimeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
}

/** この町で投稿したスポットの一覧と取り消し（N6-3） */
export function PostedSpotList({ townId }: { townId: TownId }) {
  const { state, dispatch } = useApp();
  const [confirming, setConfirming] = useState<SpotId | null>(null);
  const spots = state.postedSpots
    .filter((s) => s.townId === townId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <section className="space-y-3" aria-labelledby="posted-list-title">
      <h2 id="posted-list-title" className="text-base font-bold">
        投稿したスポット<span className="ml-1 text-sm font-normal text-muted">{spots.length}件</span>
      </h2>
      {spots.length === 0 ? (
        <p className="text-sm text-muted">まだ投稿はありません</p>
      ) : (
        <ul className="space-y-2">
          {spots.map((s) => {
            const Icon = KIND_ICON[s.kind];
            const voiceCount = state.userVoices.filter((v) => v.spotId === s.id).length;
            const isConfirming = confirming === s.id;
            return (
              <li key={s.id} className="space-y-2 rounded-xl border border-line bg-panel p-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h3 className="min-w-0 break-words font-bold">{s.name}</h3>
                  <span className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-xs text-muted">
                    <Icon size={12} aria-hidden />
                    {s.kind}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-glow/50 px-2 py-0.5 text-xs text-glow-soft">
                    <Megaphone size={12} aria-hidden />
                    町からの投稿
                  </span>
                </div>
                <p className="break-words text-sm">{s.description}</p>
                <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} aria-hidden />
                    滞在 {minutes(s.stayMin)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Wallet size={12} aria-hidden />
                    {s.costYen === 0 ? '無料' : yen(s.costYen)}
                  </span>
                  <span>投稿 {dateTimeLabel(s.createdAt)}</span>
                </p>
                {isConfirming ? (
                  <div role="alertdialog" aria-label={`${s.name}の投稿を取り消す`} className="space-y-2 rounded-lg border border-danger bg-panel-2 p-3 fade-in">
                    <p className="text-sm">
                      「{s.name}」の投稿を取り消しますか？
                      {voiceCount > 0 && <span className="font-bold text-danger">声 {voiceCount} 件も一緒に消えます。</span>}
                    </p>
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        autoFocus
                        onClick={() => setConfirming(null)}
                        className="rounded-lg px-3 py-1.5 text-sm text-muted"
                      >
                        やめる
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          dispatch({ type: 'REMOVE_POSTED_SPOT', spotId: s.id });
                          setConfirming(null);
                        }}
                        className="rounded-lg border border-danger px-3 py-1.5 text-sm font-bold text-danger"
                      >
                        取り消す
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setConfirming(s.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:text-text"
                    >
                      <Trash2 size={13} aria-hidden />
                      取り消す
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
