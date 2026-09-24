import { Eye, Sparkles, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { townById } from '../../data/towns';
import { photoCandidates } from '../../lib/partner';
import type { SpotId, SpotKind } from '../../types';

export const KIND_COLOR: Record<SpotKind, string> = { 食べる: '#7c2d12', 見る: '#1e3a5f', 体験: '#14532d' };
export const KIND_ICON: Record<SpotKind, LucideIcon> = { 食べる: UtensilsCrossed, 見る: Eye, 体験: Sparkles };

interface Props {
  kind: SpotKind | null;
  value: SpotId | null;
  onChange: (spotId: SpotId) => void;
  /** 写真の表示（別の部品が入るまでは単色の四角で代用する） */
  renderThumb?: (spotId: SpotId) => ReactNode;
  /** ラジオの name と、最初の候補に付ける id（誤りの一覧からのリンク先） */
  name?: string;
  firstId?: string;
  invalid?: boolean;
  describedBy?: string;
}

/** 投稿の写真を、同じ種類の既存スポットの写真から選ぶ（N6-2） */
export function PostPhotoPicker({ kind, value, onChange, renderThumb, name = 'post-photo', firstId, invalid, describedBy }: Props) {
  if (!kind) {
    return (
      <p id={firstId} tabIndex={-1} className="rounded-lg border border-dashed border-line px-3 py-4 text-sm text-muted">
        種類を選ぶと、写真を選べます
      </p>
    );
  }
  const Icon = KIND_ICON[kind];
  return (
    <div
      role="radiogroup"
      aria-label="写真"
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className="grid grid-cols-2 gap-2 sm:grid-cols-3"
    >
      {photoCandidates(kind).map((s, i) => {
        const checked = value === s.id;
        return (
          <label
            key={s.id}
            className={`relative block cursor-pointer overflow-hidden rounded-lg border-2 ${
              checked ? 'border-glow' : 'border-line'
            } has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-glow`}
          >
            <input
              type="radio"
              name={name}
              id={i === 0 ? firstId : undefined}
              value={s.id}
              checked={checked}
              onChange={() => onChange(s.id)}
              className="sr-only"
            />
            {renderThumb ? (
              <div className="aspect-[4/3] w-full">{renderThumb(s.id)}</div>
            ) : (
              <div
                className="flex aspect-[4/3] w-full items-center justify-center text-white/80"
                style={{ backgroundColor: KIND_COLOR[kind] }}
                aria-hidden
              >
                <Icon size={28} />
              </div>
            )}
            <span className="block truncate bg-panel-2 px-2 py-1 text-xs">
              {s.name}
              <span className="text-muted">（{townById(s.townId)?.name}）</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
