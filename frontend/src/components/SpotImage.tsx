import React, { useState } from 'react';
import type { Spot } from '../types';
import { CATEGORY_MAP } from '../utils/categoryHelpers';

/** 画像が読み込めない場合はカテゴリ色のプレースホルダーを出す */
export const SpotImage: React.FC<{ spot: Spot; className?: string }> = ({ spot, className }) => {
  const [failed, setFailed] = useState(false);
  const meta = CATEGORY_MAP[spot.category];

  if (failed || !spot.imageUrl) {
    return (
      <div
        className={`${className} flex items-center justify-center text-5xl`}
        style={{ background: `linear-gradient(135deg, ${meta.pinBg}33, ${meta.pinBg}88)` }}
      >
        {meta.emoji}
      </div>
    );
  }
  return <img src={spot.imageUrl} alt={spot.name} loading="lazy" onError={() => setFailed(true)} className={className} />;
};
