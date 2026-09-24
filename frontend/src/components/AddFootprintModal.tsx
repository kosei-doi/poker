import React, { useState } from 'react';
import { Footprints, Star } from 'lucide-react';
import type { Footprint, FootprintUserType, Spot } from '../types';
import { jitter, today } from '../utils/spotStats';
import { Modal } from './Modal';
import { Field } from './Field';
import { inputCls } from '../utils/styles';

interface AddFootprintModalProps {
  spot: Spot | null;
  onClose: () => void;
  onAdd: (spotId: string, footprint: Footprint) => void;
}

export const AddFootprintModal: React.FC<AddFootprintModalProps> = ({ spot, onClose, onAdd }) => {
  const [userType, setUserType] = useState<FootprintUserType>('visitor');
  const [userName, setUserName] = useState('');
  const [profile, setProfile] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);

  if (!spot) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(spot.id, {
      id: `fp-${Date.now()}`,
      spotId: spot.id,
      userName: userName.trim() || 'ななしの旅人',
      userType,
      profile: profile.trim() || (userType === 'local' ? '地元在住' : '旅の途中'),
      date: today(),
      comment: comment.trim(),
      rating,
      lat: jitter(spot.lat),
      lng: jitter(spot.lng),
    });
    setComment('');
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      maxWidth="max-w-md"
      title={
        <span className="flex items-center gap-2">
          <Footprints className="w-5 h-5 text-amber-600" />
          「{spot.name}」に足跡を残す
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <p className="text-xs font-bold text-stone-700 mb-1.5">あなたは？</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['visitor', '🧳 旅人として', 'border-amber-400 bg-amber-50 text-amber-900'],
              ['local', '🏡 地元の人として', 'border-emerald-500 bg-emerald-50 text-emerald-900'],
            ] as const).map(([key, label, activeCls]) => (
              <button
                type="button"
                key={key}
                onClick={() => setUserType(key)}
                className={`py-2.5 rounded-xl border-2 text-sm font-bold ${userType === key ? activeCls : 'border-stone-200 text-stone-500'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Field label="ニックネーム">
            <input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="例：さくら" className={inputCls} />
          </Field>
          <Field label={userType === 'local' ? '地元歴' : 'どこから？'}>
            <input
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              placeholder={userType === 'local' ? '例：松本在住10年' : '例：東京から'}
              className={inputCls}
            />
          </Field>
        </div>

        <div>
          <p className="text-xs font-bold text-stone-700 mb-1">評価</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n}つ星`}>
                <Star className={`w-7 h-7 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
              </button>
            ))}
          </div>
        </div>

        <Field label="ひとこと">
          <textarea
            required
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="どんな時間を過ごしましたか？次に来る人へのメッセージもどうぞ"
            className={inputCls}
          />
        </Field>

        <button type="submit" className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold">
          👣 足跡を残す
        </button>
      </form>
    </Modal>
  );
};
