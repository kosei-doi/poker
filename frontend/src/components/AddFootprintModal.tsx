import React, { useState } from 'react';
import { X, Footprints, Star } from 'lucide-react';
import type { EventItem, Footprint } from '../types';

interface AddFootprintModalProps {
  event: EventItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddFootprint: (eventId: string, newFootprint: Footprint) => void;
}

export const AddFootprintModal: React.FC<AddFootprintModalProps> = ({
  event,
  isOpen,
  onClose,
  onAddFootprint,
}) => {
  const [userName, setUserName] = useState('');
  const [userType, setUserType] = useState<Footprint['userType']>('観光客');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [highlightTag, setHighlightTag] = useState('');

  if (!isOpen || !event) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !comment.trim()) {
      alert('お名前と体験のひとことを入力してください。');
      return;
    }

    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(
      today.getDate()
    ).padStart(2, '0')}`;

    const newFp: Footprint = {
      id: `fp-${Date.now()}`,
      eventId: event.id,
      userName: userName.trim(),
      userType,
      date: dateStr,
      rating,
      comment: comment.trim(),
      highlightTag: highlightTag.trim() || '心に残る体験',
    };

    onAddFootprint(event.id, newFp);
    onClose();
    // Reset
    setUserName('');
    setComment('');
    setHighlightTag('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div 
        className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-stone-200 my-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-amber-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-stone-900">
                催しに足跡を残す
              </h2>
              <p className="text-xs text-stone-500 line-clamp-1">
                対象: {event.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              お名前・ニックネーム（地域名など） <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="例: ユウキ（東京都から旅行）"
              className="w-full text-xs p-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                あなたの旅のスタイル
              </label>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value as Footprint['userType'])}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-amber-500 font-semibold"
              >
                <option value="観光客">観光・旅行客</option>
                <option value="移住検討中">移住検討・下見中</option>
                <option value="ワーケーション">ワーケーション</option>
                <option value="地元ファン">地元住民・ファン</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                満足度
              </label>
              <div className="flex items-center gap-1 py-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-stone-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              体験のひとこと・参加した感想 <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="例: 地元のおばあちゃんが親切で、新米の美味しさに感動しました！また訪れたいです。"
              className="w-full text-xs p-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-amber-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              一押しハイライトタグ（任意）
            </label>
            <input
              type="text"
              value={highlightTag}
              onChange={(e) => setHighlightTag(e.target.value)}
              placeholder="例: 出店者さんとの会話、絶景、焚き火の温もり"
              className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-amber-600/20 active:scale-95 transition-all"
            >
              足跡を刻む
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
