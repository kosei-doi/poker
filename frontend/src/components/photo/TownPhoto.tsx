import { getTownPhoto } from '../../data/photos';
import { townById } from '../../data/towns';
import { Photo } from './Photo';

interface Props {
  townId: string;
  size: 'hero' | 'card' | 'thumb';
  caption?: 'overlay' | 'below' | 'none';
  className?: string;
}

/** 町のイメージ写真 */
export function TownPhoto({ townId, size, caption, className }: Props) {
  const name = townById(townId)?.name;
  return (
    <Photo
      photo={getTownPhoto(townId)}
      fallbackKind="town"
      size={size}
      caption={caption}
      alt={name ? `${name}のイメージ写真` : undefined}
      className={className}
    />
  );
}
