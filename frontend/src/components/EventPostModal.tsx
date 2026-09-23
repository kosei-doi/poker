import React, { useState, useMemo } from 'react';
import { 
  X, PlusCircle, Image as ImageIcon, Heart, 
  Calendar as CalendarIcon, Clock, MapPin, 
  Check, DollarSign, Users, Tag 
} from 'lucide-react';
import type { EventItem, EventCategory } from '../types';
import { CATEGORY_MAP } from '../utils/categoryHelpers';

interface EventPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (newEvent: EventItem) => void;
}

const PRESET_IMAGES = [
  { label: 'マルシェ・食', url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=800&q=80' },
  { label: '手仕事・工房', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80' },
  { label: '祭り・提灯', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80' },
  { label: '里山・農業', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80' },
  { label: '音楽・シネマ', url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80' },
];

// Helper to format Date string (YYYY-MM-DD) to Japanese friendly string
function formatToJapaneseDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const dayNum = d.getDate();
  const dayName = days[d.getDay()];
  return `${y}年${m}月${dayNum}日 (${dayName})`;
}

// Get upcoming Saturday and Sunday
function getNextWeekendDates() {
  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sunday, 6 is Saturday
  
  // Next Saturday
  const satDiff = (6 - currentDay + 7) % 7 || 7;
  const sat = new Date(now);
  sat.setDate(now.getDate() + satDiff);

  // Next Sunday
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);

  const formatIso = (d: Date) => d.toISOString().split('T')[0];

  return {
    thisSat: formatIso(sat),
    thisSun: formatIso(sun)
  };
}

export const EventPostModal: React.FC<EventPostModalProps> = ({
  isOpen,
  onClose,
  onAddEvent,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('marche');
  const [catchphrase, setCatchphrase] = useState('');

  // Enhanced Calendar & Time states
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [startDate, setStartDate] = useState(todayStr);
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('15:30');

  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('長野県安曇野市');
  const [description, setDescription] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [organizerRole, setOrganizerRole] = useState('');
  const [organizerStory, setOrganizerStory] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [fee, setFee] = useState('入場無料');
  const [capacity, setCapacity] = useState('自由参加');
  const [tagsInput, setTagsInput] = useState('地域交流, 初心者歓迎');

  const weekend = useMemo(() => getNextWeekendDates(), []);

  if (!isOpen) return null;

  // Format final date display string
  const formattedDateString = isMultiDay && endDate
    ? `${formatToJapaneseDate(startDate)} - ${formatToJapaneseDate(endDate)}`
    : formatToJapaneseDate(startDate);

  const formattedTimeString = `${startTime} - ${endTime}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !locationName.trim() || !startDate) {
      alert('催しの名称、開催日、場所を入力してください。');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const baseLat = 36.28 + (Math.random() - 0.5) * 0.12;
    const baseLng = 137.90 + (Math.random() - 0.5) * 0.12;

    const newEvent: EventItem = {
      id: `evt-${Date.now()}`,
      title: title.trim(),
      category,
      date: formattedDateString,
      time: formattedTimeString,
      locationName: locationName.trim(),
      address: address.trim(),
      lat: Number(baseLat.toFixed(4)),
      lng: Number(baseLng.toFixed(4)),
      catchphrase: catchphrase.trim() || '地域を愛する仲間が集まるあたたかな催し',
      description: description.trim() || '地域の魅力と温かさを体感できるイベントです。ぜひお気軽にお立ち寄りください。',
      organizer: {
        name: organizerName.trim() || '地域づくり有志の会',
        role: organizerRole.trim() || '催し実行委員',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        story: organizerStory.trim() || 'この地域の良さをたくさんの方に知ってもらい、日常の温かさに触れてほしいです。'
      },
      imageUrl,
      tags: tags.length > 0 ? tags : ['地域交流', '週末'],
      recommendedFor: ['観光・旅行者歓迎', '地元ファン'],
      capacity,
      fee,
      footprints: [],
      nearbySpots: [
        {
          id: `spot-${Date.now()}-1`,
          name: `${locationName} 周辺の散策小径`,
          category: '自然・散歩',
          distance: '徒歩3分',
          description: '四季折々の里山風景をのんびり楽しめる散歩道'
        }
      ]
    };

    onAddEvent(newEvent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div 
        className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-stone-200 my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-xs">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-stone-900">
                地域の催し・イベントを投稿
              </h2>
              <p className="text-[11px] text-stone-500">
                カレンダーやプリセットを使って簡単に登録・発信できます
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1">
          {/* Title & Catchphrase */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              催しの名称 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 里山クラフト市、古民家の秋祭り..."
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              ひとことキャッチフレーズ
            </label>
            <input
              type="text"
              value={catchphrase}
              onChange={(e) => setCatchphrase(e.target.value)}
              placeholder="例: 北アルプスの麓で手仕事と笑顔に出会う特別な一日"
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5">
              カテゴリ <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(Object.keys(CATEGORY_MAP) as EventCategory[]).map((cat) => {
                const meta = CATEGORY_MAP[cat];
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center ${
                      isSelected
                        ? `${meta.color} text-white shadow-xs border-transparent`
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calendar Date Picker & Quick Selectors */}
          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-emerald-600" />
                <span>開催日程の選択 <span className="text-rose-500">*</span></span>
              </label>

              {/* Multi-day toggle */}
              <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isMultiDay}
                  onChange={(e) => setIsMultiDay(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium">2日以上開催</span>
              </label>
            </div>

            {/* Quick Date Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-stone-500 font-semibold mr-1">クイック選択:</span>
              <button
                type="button"
                onClick={() => setStartDate(todayStr)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:border-emerald-500 text-stone-700 font-medium transition-colors"
              >
                今日
              </button>
              <button
                type="button"
                onClick={() => setStartDate(weekend.thisSat)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:border-emerald-500 text-stone-700 font-medium transition-colors"
              >
                今週末（土曜）
              </button>
              <button
                type="button"
                onClick={() => setStartDate(weekend.thisSun)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:border-emerald-500 text-stone-700 font-medium transition-colors"
              >
                今週末（日曜）
              </button>
            </div>

            {/* Date Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="block text-[11px] text-stone-600 font-bold mb-1">
                  {isMultiDay ? '開始日' : '開催日'}
                </span>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-white font-semibold text-stone-800 focus:outline-hidden focus:border-emerald-500 shadow-2xs"
                />
              </div>

              {isMultiDay && (
                <div>
                  <span className="block text-[11px] text-stone-600 font-bold mb-1">
                    終了日
                  </span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-white font-semibold text-stone-800 focus:outline-hidden focus:border-emerald-500 shadow-2xs"
                  />
                </div>
              )}
            </div>

            {/* Live Formatted Date Preview */}
            <div className="text-xs text-emerald-800 font-bold bg-white/80 px-3 py-1.5 rounded-lg border border-emerald-200/60 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>表示形式: {formattedDateString}</span>
            </div>
          </div>

          {/* Time Picker & Presets */}
          <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>開催時間帯</span>
              </label>

              {/* Time Presets */}
              <div className="flex items-center gap-1">
                {[
                  { label: '終日', s: '10:00', e: '16:00' },
                  { label: '午前', s: '09:00', e: '12:30' },
                  { label: '午後', s: '13:00', e: '16:30' },
                  { label: '夜・夕', s: '17:00', e: '20:30' },
                ].map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => {
                      setStartTime(preset.s);
                      setEndTime(preset.e);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-amber-200 hover:bg-amber-100 text-stone-700 font-semibold transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block text-[11px] text-stone-600 font-bold mb-1">開始時刻</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-white font-semibold text-stone-800 focus:outline-hidden focus:border-amber-500 shadow-2xs"
                />
              </div>
              <div>
                <span className="block text-[11px] text-stone-600 font-bold mb-1">終了時刻</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-white font-semibold text-stone-800 focus:outline-hidden focus:border-amber-500 shadow-2xs"
                />
              </div>
            </div>

            <div className="text-xs text-amber-900 font-bold bg-white/80 px-3 py-1.5 rounded-lg border border-amber-200/60 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>表示形式: {formattedTimeString}</span>
            </div>
          </div>

          {/* Location & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>開催場所・施設名 <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="例: 穂高駅前広場、国営アルプス公園..."
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                市区町村・住所
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="例: 長野県安曇野市..."
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Fee & Capacity Quick Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fee */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                  <span>参加費</span>
                </label>
                <div className="flex items-center gap-1">
                  {['入場無料', '500円', '1,000円', '実費'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFee(f)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="例: 入場無料、材料費1,500円など"
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            {/* Capacity */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>定員・参加条件</span>
                </label>
                <div className="flex items-center gap-1">
                  {['自由参加', '先着15名', '要事前予約'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCapacity(c)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="例: 自由参加、先着20名など"
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              催しの内容・見どころ
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="催しの詳しい内容、出店者、体験できることなどを教えてください。"
              className="w-full text-xs p-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-emerald-500 leading-relaxed"
            />
          </div>

          {/* Organizer Story (Heart of the feature) */}
          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 space-y-3">
            <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              <span>主催者の想い・ストーリー（外から来る人へ伝えたいこと）</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                placeholder="お名前（例: 佐藤 健一）"
                className="text-xs p-2.5 rounded-lg border border-stone-200 bg-white"
              />
              <input
                type="text"
                value={organizerRole}
                onChange={(e) => setOrganizerRole(e.target.value)}
                placeholder="肩書（例: りんご農家3代目 / 協力隊）"
                className="text-xs p-2.5 rounded-lg border border-stone-200 bg-white"
              />
            </div>
            <textarea
              rows={2}
              value={organizerStory}
              onChange={(e) => setOrganizerStory(e.target.value)}
              placeholder="なぜこの催しを始めたのか、どんな人に来てほしいか..."
              className="w-full text-xs p-2.5 rounded-lg border border-stone-200 bg-white leading-relaxed"
            />
          </div>

          {/* Preset Image Chooser */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>カバー写真を選択（ワンタップで設定）</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_IMAGES.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setImageUrl(img.url)}
                  className={`relative rounded-xl overflow-hidden cursor-pointer border-2 h-14 sm:h-16 transition-all ${
                    imageUrl === img.url
                      ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-[10px] text-white font-bold p-1 text-center leading-tight">
                    {img.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-stone-500" />
              <span>タグ（カンマ区切り）</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="例: 地場産品, 家族連れ歓迎, 体験"
              className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 active:scale-95 transition-all"
            >
              催しを公開する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
