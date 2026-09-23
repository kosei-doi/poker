import React, { useState } from 'react';
import { 
  Compass, Sparkles, Navigation, 
  Share2, Check, Info 
} from 'lucide-react';
import type { TourPlan, EventItem } from '../types';
import { SAMPLE_TOUR_PLANS } from '../data/mockData';

interface TourPlannerViewProps {
  events: EventItem[];
  initialSelectedEventId?: string;
  onSelectEvent: (event: EventItem) => void;
}

export const TourPlannerView: React.FC<TourPlannerViewProps> = ({
  events,
  initialSelectedEventId,
  onSelectEvent
}) => {
  const [plans, setPlans] = useState<TourPlan[]>(SAMPLE_TOUR_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(SAMPLE_TOUR_PLANS[0].id);

  // Generator interactive form states
  const [targetEventId, setTargetEventId] = useState<string>(
    initialSelectedEventId || (events[0] ? events[0].id : '')
  );
  const [travelTheme, setTravelTheme] = useState<string>('nature');
  const [duration, setDuration] = useState<string>('1day');
  const [travelerType, setTravelerType] = useState<string>('solo');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const currentPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  const handleGeneratePlan = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const targetEvt = events.find((e) => e.id === targetEventId) || events[0];
      const spot1 = targetEvt.nearbySpots[0]?.name || '地元の名所散策';
      const spot2 = targetEvt.nearbySpots[1]?.name || '隠れ家ローカル茶房';

      const themeLabels: Record<string, string> = {
        nature: '自然と深呼吸',
        food: '美食と地場産品',
        culture: '文化と手仕事体験',
        chill: 'のんびりリフレッシュ'
      };

      const newPlan: TourPlan = {
        id: `plan-gen-${Date.now()}`,
        title: `【${themeLabels[travelTheme] || '里山めぐり'}】${targetEvt.title.slice(0, 16)}を満喫する旅`,
        subtitle: `地域の催し「${targetEvt.title}」をコアに、周辺の穴場スポットと名物を効率よく巡るオリジナル回遊プラン`,
        theme: themeLabels[travelTheme] || '地域探訪',
        target: travelerType === 'solo' ? 'ひとり旅' : travelerType === 'friends' ? '友人グループ' : 'ファミリー',
        duration: duration === 'half' ? '半日（約4時間）' : '1日（約7時間）',
        recommendedTransport: 'レンタカー または レンタサイクル（電動アシスト推奨）',
        items: [
          {
            time: '10:30',
            title: `催し「${targetEvt.title}」に参加`,
            type: 'event',
            locationName: targetEvt.locationName,
            description: `まずはメインイベントへ。主催者の${targetEvt.organizer.name}さんや地元の人たちと交流しながら、地域の魅力に浸る。`,
            tips: '「めぐりまち」で参加者の足跡を事前にチェックしておくとより楽しめます！'
          },
          {
            time: '12:45',
            title: `周辺名所「${spot1}」で名物を楽しむランチ`,
            type: 'meal',
            locationName: spot1,
            description: 'イベント会場からほど近い名物スポットへ移動。地元食材をふんだんに使った郷土の味でエネルギー補給。',
            tips: 'テラス席がある場合はそちらがおすすめ。'
          },
          {
            time: '14:30',
            title: `穴場スポット「${spot2}」でゆったりカフェ＆散策`,
            type: 'spot',
            locationName: spot2,
            description: '旅の締めくくりに、澄んだ空気を味わいながらのんびり散策とお土産選び。',
            tips: '地元限定のクラフト品や特産品をチェック！'
          },
          {
            time: '16:30',
            title: '足跡マップに今日の体験ログを投稿',
            type: 'break',
            locationName: '帰路・宿',
            description: '今日出会った地元の人や感動した景色を「めぐりまち」に足跡として残し、次の旅人へバトンを繋ぐ。',
            tips: '写真とともにひとこと感想を残すと地域への応援になります！'
          }
        ]
      };

      setPlans((prev) => [newPlan, ...prev]);
      setSelectedPlanId(newPlan.id);
      setIsGenerating(false);
    }, 600);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-900 rounded-3xl p-5 sm:p-10 text-white shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-semibold mb-2 sm:mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>回遊性向上 ✕ 地域の関係人口づくり</span>
        </div>
        <h1 className="text-xl sm:text-4xl font-extrabold mb-2 leading-snug">
          催しと名所をつなぐ「地域周遊プラン」
        </h1>
        <p className="text-teal-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
          単発のイベント参加だけで終わらせず、周辺の隠れ家カフェや景勝地、地元直売所を組み合わせた「1日の旅のしおり」を自動提案します。
        </p>
      </div>

      {/* Generator Section */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200 shadow-md">
        <h3 className="text-sm sm:text-base font-bold text-stone-900 mb-3 sm:mb-4 flex items-center gap-2">
          <Compass className="w-5 h-5 text-teal-600" />
          <span>あなたの希望に合わせてAI周遊プランを自動作成</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {/* Base Event */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              ① 参加したいメイン催し
            </label>
            <select
              value={targetEventId}
              onChange={(e) => setTargetEventId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-teal-500 font-medium"
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title}
                </option>
              ))}
            </select>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              ② 旅のテーマ
            </label>
            <select
              value={travelTheme}
              onChange={(e) => setTravelTheme(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-teal-500 font-medium"
            >
              <option value="nature">自然と深呼吸（景色・散策）</option>
              <option value="food">美食と地場産品（直売所・カフェ）</option>
              <option value="culture">文化と手仕事（歴史・工房）</option>
              <option value="chill">のんびり癒やし（温泉・休憩）</option>
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              ③ 所要時間
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-teal-500 font-medium"
            >
              <option value="half">半日コース（約3〜4時間）</option>
              <option value="full">1日満喫コース（約6〜8時間）</option>
            </select>
          </div>

          {/* Traveler */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              ④ 同行者
            </label>
            <select
              value={travelerType}
              onChange={(e) => setTravelerType(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:border-teal-500 font-medium"
            >
              <option value="solo">ひとり旅・ワーケーション</option>
              <option value="friends">カップル・友人</option>
              <option value="family">子連れファミリー</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm shadow-md shadow-teal-700/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? 'プランを組み立て中...' : 'この条件で周遊プランを生成'}</span>
          </button>
        </div>
      </div>

      {/* Plans Switcher & Selected Plan Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Available Plans List */}
        <div className="lg:col-span-4 space-y-3">
          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider px-1">
            おすすめ＆生成済みプラン一覧 ({plans.length})
          </h4>
          {plans.map((p) => {
            const isSelected = p.id === selectedPlanId;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlanId(p.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-50/80 border-teal-400 ring-2 ring-teal-500/20 shadow-xs'
                    : 'bg-white hover:bg-stone-50 border-stone-200 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-teal-800 font-bold mb-1">
                  <span>{p.theme}</span>
                  <span className="text-stone-400 font-normal">{p.duration}</span>
                </div>
                <h5 className="font-extrabold text-sm text-stone-900 leading-snug mb-1">
                  {p.title}
                </h5>
                <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                  {p.subtitle}
                </p>
              </div>
            );
          })}
        </div>

        {/* Selected Plan Itinerary (旅のしおり) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-4 sm:p-8 border border-stone-200 shadow-md">
          {/* Plan Header */}
          <div className="pb-6 border-b border-stone-200">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-100 text-teal-800">
                  {currentPlan.theme}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700">
                  対象: {currentPlan.target}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700">
                  目安: {currentPlan.duration}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-xs font-medium text-stone-700 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copied ? 'コピー完了' : 'しおりを共有'}</span>
                </button>
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 mb-2">
              {currentPlan.title}
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {currentPlan.subtitle}
            </p>

            <div className="mt-3 flex items-center gap-2 text-xs text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
              <Navigation className="w-4 h-4 text-teal-600 shrink-0" />
              <span>推奨移動手段: <strong className="text-stone-800">{currentPlan.recommendedTransport}</strong></span>
            </div>
          </div>

          {/* Timeline Itinerary Items */}
          <div className="pt-6 relative">
            <div className="absolute top-8 bottom-8 left-[17px] w-0.5 bg-stone-200" />

            <div className="space-y-6">
              {currentPlan.items.map((item, idx) => {
                const isEvent = item.type === 'event';
                const matchedEvent = isEvent ? events.find((e) => item.title.includes(e.title) || e.title.includes(item.title)) : null;

                return (
                  <div key={idx} className="relative flex items-start gap-4 group">
                    {/* Time Pin */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 text-xs font-bold border-2 transition-all ${
                        isEvent
                          ? 'bg-emerald-600 text-white border-emerald-300 shadow-md ring-4 ring-emerald-50'
                          : item.type === 'meal'
                          ? 'bg-amber-500 text-white border-amber-200 shadow-sm'
                          : 'bg-white text-stone-700 border-stone-300 shadow-2xs'
                      }`}
                    >
                      {item.time.slice(0, 5)}
                    </div>

                    {/* Content Box */}
                    <div
                      className={`flex-1 p-4 rounded-2xl border transition-all ${
                        isEvent
                          ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
                          : 'bg-stone-50/70 border-stone-200 hover:bg-stone-100/70'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-1.5 font-bold text-stone-900 text-sm">
                          {isEvent && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-600 text-white font-semibold">
                              催し
                            </span>
                          )}
                          <span>{item.title}</span>
                        </div>
                        <span className="text-[11px] text-stone-500">
                          📍 {item.locationName}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-stone-700 leading-relaxed mb-2">
                        {item.description}
                      </p>

                      {matchedEvent && (
                        <button
                          onClick={() => onSelectEvent(matchedEvent)}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline mb-2 block"
                        >
                          この催しの詳細・ストーリーを見る →
                        </button>
                      )}

                      {item.tips && (
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-600 bg-white/80 p-2 rounded-lg border border-stone-200/60 font-medium">
                          <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>ワンポイント: {item.tips}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
