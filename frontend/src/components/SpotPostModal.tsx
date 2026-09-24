import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import type { Spot, SpotCategory } from '../types';
import { AREA_CENTER, AREAS, PRESET_IMAGES } from '../data/mockData';
import { CATEGORY_KEYS, CATEGORY_MAP } from '../utils/categoryHelpers';
import { jitter, today } from '../utils/spotStats';
import { inputCls } from '../utils/styles';
import { Field } from './Field';
import { LocationPicker } from './LocationPicker';
import { Modal } from './Modal';

interface SpotPostModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (spot: Spot) => void;
}

const EMPTY = {
  name: '',
  category: 'gourmet' as SpotCategory,
  area: AREAS[0] as string,
  catchphrase: '',
  description: '',
  localTip: '',
  bestTime: '',
  stayMinutes: 60,
  tags: '',
  imageUrl: PRESET_IMAGES[0].url,
  authorName: '',
  authorRelation: '',
};

export const SpotPostModal: React.FC<SpotPostModalProps> = ({ open, onClose, onAdd }) => {
  const [form, setForm] = useState(EMPTY);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!position) {
      setError('地図で場所を選んでください');
      return;
    }
    const id = `spot-${Date.now()}`;
    const [lat, lng] = position;
    const authorName = form.authorName.trim() || '地元のひと';
    onAdd({
      id,
      name: form.name.trim(),
      category: form.category,
      area: form.area,
      address: `長野県${form.area}市`,
      lat,
      lng,
      catchphrase: form.catchphrase.trim(),
      description: form.description.trim(),
      localTip: form.localTip.trim(),
      bestTime: form.bestTime.trim() || 'いつでも',
      stayMinutes: form.stayMinutes,
      imageUrl: form.imageUrl,
      tags: form.tags.split(/[,、\s]+/).map((t) => t.replace(/^#/, '')).filter(Boolean),
      author: { name: authorName, relation: form.authorRelation.trim() || `${form.area}在住` },
      postedAt: today(),
      // 投稿者自身の足跡を最初の1つとして記録する
      footprints: [
        {
          id: `${id}-fp-1`,
          spotId: id,
          userName: authorName,
          userType: 'local',
          profile: form.authorRelation.trim() || `${form.area}在住`,
          date: today(),
          comment: 'この場所を投稿しました。ぜひ遊びに来てください！',
          rating: 5,
          lat: jitter(lat, 60),
          lng: jitter(lng, 60),
        },
      ],
    });
    setForm(EMPTY);
    setPosition(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-emerald-600" />
          地元の穴場を教える
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <p className="text-xs text-stone-500 leading-relaxed bg-emerald-50 border border-emerald-100 rounded-xl p-3">
          ガイドブックに載っていない「地元の人のいつもの場所」を教えてください。投稿されたスポットはAI旅プランにも使われ、旅人を地域へ案内します。
        </p>

        <Field label="スポット名 *">
          <input required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="例：川沿いの小さなパン屋" className={inputCls} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="カテゴリ">
            <select value={form.category} onChange={(e) => set('category', e.target.value as SpotCategory)} className={inputCls}>
              {CATEGORY_KEYS.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_MAP[c].emoji} {CATEGORY_MAP[c].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="エリア">
            <select value={form.area} onChange={(e) => set('area', e.target.value)} className={inputCls}>
              {AREAS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </Field>
        </div>

        <div>
          <p className="text-xs font-bold text-stone-700 mb-1">場所 *</p>
          {open && <LocationPicker center={AREA_CENTER[form.area]} value={position} onChange={(p) => { setPosition(p); setError(null); }} />}
          {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
        </div>

        <Field label="ひとことで言うと *">
          <input required value={form.catchphrase} onChange={(e) => set('catchphrase', e.target.value)} placeholder="例：焼きたてのにおいで朝が始まる店" className={inputCls} />
        </Field>
        <Field label="どんな場所？ *">
          <textarea required rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} className={inputCls} />
        </Field>
        <Field label="地元の人だけが知っている楽しみ方 *" hint="おすすめの時間帯、裏メニュー、お店の人との話し方など">
          <textarea required rows={2} value={form.localTip} onChange={(e) => set('localTip', e.target.value)} className={inputCls} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="おすすめの時間">
            <input value={form.bestTime} onChange={(e) => set('bestTime', e.target.value)} placeholder="例：平日の朝" className={inputCls} />
          </Field>
          <Field label="滞在目安（分）">
            <input type="number" min={10} step={5} value={form.stayMinutes} onChange={(e) => set('stayMinutes', Number(e.target.value))} className={inputCls} />
          </Field>
        </div>

        <Field label="タグ" hint="カンマ区切り（例：パン, 朝ごはん, テイクアウト）">
          <input value={form.tags} onChange={(e) => set('tags', e.target.value)} className={inputCls} />
        </Field>

        <div>
          <p className="text-xs font-bold text-stone-700 mb-1">イメージ画像</p>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_IMAGES.map((p) => (
              <button
                type="button"
                key={p.url}
                onClick={() => set('imageUrl', p.url)}
                className={`relative h-14 rounded-lg overflow-hidden border-2 ${form.imageUrl === p.url ? 'border-emerald-500' : 'border-transparent'}`}
              >
                <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                <span className="absolute bottom-0 inset-x-0 text-[9px] bg-black/50 text-white">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="投稿者名">
            <input value={form.authorName} onChange={(e) => set('authorName', e.target.value)} placeholder="例：山田 花子" className={inputCls} />
          </Field>
          <Field label="地域とのつながり">
            <input value={form.authorRelation} onChange={(e) => set('authorRelation', e.target.value)} placeholder="例：松本在住20年・パン好き" className={inputCls} />
          </Field>
        </div>

        <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold">
          この穴場を公開する
        </button>
      </form>
    </Modal>
  );
};
