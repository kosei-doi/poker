import { MapPin, Mountain, Sparkles, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { PhotoRef } from '../../data/photos';
import type { SpotKind } from '../../types';
import './photo.css';

export const PHOTO_NOTE = 'イメージ写真（実際の場所ではありません）';

type Size = 'hero' | 'card' | 'thumb';
type Caption = 'overlay' | 'below' | 'none';

interface Props {
  photo: PhotoRef | null;
  /** 読み込めないときの色とアイコン */
  fallbackKind: SpotKind | 'town';
  size: Size;
  /** 省略時: hero・card は 'overlay'、thumb は 'none'（一覧の側で PhotoListNote を出す） */
  caption?: Caption;
  /** photo が null のときの代わりの表示の読み上げ（例: '{名前}のイメージ写真'） */
  alt?: string;
  className?: string;
}

const BOX: Record<Size, string> = {
  hero: 'w-full aspect-[3/2]',
  card: 'w-full aspect-video',
  thumb: 'size-14',
};

const ICON: Record<SpotKind | 'town', LucideIcon> = {
  食べる: UtensilsCrossed,
  見る: Mountain,
  体験: Sparkles,
  town: MapPin,
};

/** イメージ写真（N5-1・N5-2・N5-6）。箱の大きさは aspect-ratio で先に決め、読み込み前後でずれない */
export function Photo({ photo, fallbackKind, size, caption, alt, className = '' }: Props) {
  // 失敗した src を覚える。photo が変わると src が変わるので、エラー状態は自然に戻る
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = photo === null || failedSrc === photo.src;
  const cap = caption ?? (size === 'thumb' ? 'none' : 'overlay');
  const label = photo?.alt ?? alt ?? 'イメージ写真';
  const Icon = ICON[fallbackKind];

  return (
    <figure className={`${size === 'thumb' ? 'shrink-0' : 'w-full'} ${className}`}>
      <div className={`relative overflow-hidden rounded-lg ${BOX[size]}`}>
        {failed ? (
          <div
            role="img"
            aria-label={label}
            data-kind={fallbackKind}
            className="photo-fallback grid place-items-center size-full"
          >
            <Icon size={size === 'thumb' ? 22 : 36} className="text-white" aria-hidden />
          </div>
        ) : (
          <img
            src={photo.src}
            alt={photo.alt}
            width={photo.credit.width}
            height={photo.credit.height}
            loading="lazy"
            decoding="async"
            onError={() => setFailedSrc(photo.src)}
            className="size-full object-cover"
          />
        )}
        {/* 帯は写真のときだけ（代わりの表示は写真ではないため） */}
        {!failed && cap === 'overlay' && (
          <p className="photo-overlay absolute bottom-0 left-0 max-w-full rounded-tr-md px-1.5 py-0.5 text-[10px] leading-snug text-white">
            {PHOTO_NOTE}
          </p>
        )}
      </div>
      {/* below は代わりの表示でも残し、読み込みの成否で高さを変えない（N5-6） */}
      {cap === 'below' && <figcaption className="mt-1 text-xs text-muted">{PHOTO_NOTE}</figcaption>}
    </figure>
  );
}
