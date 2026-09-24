import { getSpotPhoto } from '../../data/photos';
import { spotById } from '../../data/spots';
import { Photo } from './Photo';

interface Props {
  spotId: string;
  size: 'hero' | 'card' | 'thumb';
  caption?: 'overlay' | 'below' | 'none';
  className?: string;
}

/** スポットのイメージ写真。代わりの表示の色とアイコンはスポットの種類で決まる */
export function SpotPhoto({ spotId, size, caption, className }: Props) {
  const spot = spotById(spotId);
  return (
    <Photo
      photo={getSpotPhoto(spotId)}
      fallbackKind={spot?.kind ?? '見る'}
      size={size}
      caption={caption}
      alt={spot ? `${spot.name}のイメージ写真` : undefined}
      className={className}
    />
  );
}
