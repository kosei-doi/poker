import React, { useState } from 'react';
import { 
  Sparkles, CheckCircle2, ArrowRight, MapPin, 
  Calendar, RotateCcw, HeartHandshake, Footprints, Compass 
} from 'lucide-react';
import type { EventItem } from '../types';
import { CATEGORY_MAP } from '../utils/categoryHelpers';

interface MatchCriteria {
  companion: 'solo' | 'couple' | 'friends' | 'family';
  interest: 'food' | 'culture' | 'nature' | 'chill' | 'interact';
  involvement: 'tourist' | 'volunteer' | 'relocate';
  transport: 'car' | 'transit';
}

interface ScoredEvent {
  event: EventItem;
  score: number;
  matchReasons: string[];
}

interface EventMatchFinderProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  onViewOnMap: (event: EventItem) => void;
  onPlanTrip: (event: EventItem) => void;
}

export const EventMatchFinder: React.FC<EventMatchFinderProps> = ({
  events,
  onSelectEvent,
  onViewOnMap,
  onPlanTrip
}) => {
  const [companion, setCompanion] = useState<MatchCriteria['companion']>('solo');
  const [interest, setInterest] = useState<MatchCriteria['interest']>('food');
  const [involvement, setInvolvement] = useState<MatchCriteria['involvement']>('tourist');
  const [transport, setTransport] = useState<MatchCriteria['transport']>('car');
  const [isCalculated, setIsCalculated] = useState(false);
  const [matchedResults, setMatchedResults] = useState<ScoredEvent[]>([]);

  const handleMatch = () => {
    // Calculate match score and reasons for each event
    const scored: ScoredEvent[] = events.map((evt) => {
      let score = 70; // baseline
      const reasons: string[] = [];

      // Interest matching
      if (interest === 'food' && (evt.category === 'marche' || evt.tags.some(t => t.includes('野菜') || t.includes('米') || t.includes('味噌')))) {
        score += 15;
        reasons.push('採れたて野菜や地元発酵食など、食へのこだわりが満載');
      } else if (interest === 'culture' && (evt.category === 'workshop' || evt.category === 'festival' || evt.tags.some(t => t.includes('伝統') || t.includes('クラフト')))) {
        score += 15;
        reasons.push('地域の歴史ある伝統や職人の手仕事に深く触れられる');
      } else if (interest === 'nature' && (evt.category === 'nature' || evt.tags.some(t => t.includes('絶景') || t.includes('棚田') || t.includes('里山')))) {
        score += 15;
        reasons.push('澄んだ空気と北アルプスの原風景を五感で楽しめる');
      } else if (interest === 'interact') {
        score += 12;
        reasons.push('地元住民や主催者と顔を合わせておしゃべりできる温かい距離感');
      } else if (interest === 'chill') {
        score += 10;
        reasons.push('喧騒を離れ、のんびりマイペースに過ごせる');
      }

      // Companion matching
      if (companion === 'solo') {
        if (evt.recommendedFor.some(r => r.includes('ひとり') || r.includes('旅'))) {
          score += 8;
          reasons.push('ひとりでも気兼ねなく溶け込めるアットホームな雰囲気');
        }
      } else if (companion === 'family') {
        if (evt.recommendedFor.some(r => r.includes('家族') || r.includes('親子')) || evt.tags.includes('家族連れ歓迎')) {
          score += 10;
          reasons.push('広々とした芝生や体験内容が子連れファミリーに最適');
        }
      } else if (companion === 'couple' || companion === 'friends') {
        if (evt.tags.some(t => t.includes('フォト') || t.includes('シネマ') || t.includes('カフェ') || t.includes('散策'))) {
          score += 8;
          reasons.push('写真映えする景観と思い出に残る特別なひととき');
        }
      }

      // Involvement matching (Regional Revitalization Core!)
      if (involvement === 'volunteer') {
        if (evt.category === 'nature' || evt.category === 'volunteer' || evt.capacity?.includes('ボランティア') || evt.tags.includes('ボランティア体験')) {
          score += 12;
          reasons.push('地域のお手伝い・ボランティアを通じて地域の一員になれる！');
        }
      } else if (involvement === 'relocate') {
        if (evt.organizer.role.includes('移住') || evt.footprints.some(f => f.userType === '移住検討中' || f.userType === 'ワーケーション')) {
          score += 12;
          reasons.push('移住者・ワーケーション滞在者が多く集まりリアルな暮らし相談ができる');
        }
      } else {
        score += 5;
        reasons.push('観光客も大歓迎で気軽に立ち寄れるオープンな催し');
      }

      // Clamp score
      const finalScore = Math.min(score, 98);

      return {
        event: evt,
        score: finalScore,
        matchReasons: reasons
      };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);
    setMatchedResults(scored);
    setIsCalculated(true);
  };

  const handleReset = () => {
    setIsCalculated(false);
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-8 border border-stone-200 shadow-md mb-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 pb-4 border-b border-stone-100">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-1 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI地域コンシェルジュ</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-extrabold text-stone-900 leading-snug">
            条件を入力して、あなたにぴったりの催しを見つける
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            旅のスタイルや興味に合わせて、地域創生につながる最適な催しをマッチングします。
          </p>
        </div>

        {isCalculated && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-600 self-start sm:self-auto transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>条件を変えて再診断</span>
          </button>
        )}
      </div>

      {/* Conditions Input Grid */}
      {!isCalculated ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Condition 1: Companion */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-2">
                ① 誰と訪れますか？
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'solo', label: 'ひとり旅' },
                  { id: 'couple', label: '恋人・夫婦' },
                  { id: 'friends', label: '友人グループ' },
                  { id: 'family', label: '子連れ家族' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCompanion(item.id as MatchCriteria['companion'])}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                      companion === item.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Condition 2: Interest */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-2">
                ② どんな体験がしたい？
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'food', label: 'おいしい地場食' },
                  { id: 'culture', label: '伝統・手仕事' },
                  { id: 'nature', label: '自然・里山' },
                  { id: 'interact', label: '地元民と交流' },
                  { id: 'chill', label: '静かにのんびり' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setInterest(item.id as MatchCriteria['interest'])}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                      interest === item.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Condition 3: Involvement (Regional Revitalization) */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-2">
                ③ 地域との関わり方は？
              </label>
              <div className="space-y-2">
                {[
                  { id: 'tourist', label: '気軽に楽しむ観光', desc: 'まずは地域の空気を味わう' },
                  { id: 'volunteer', label: 'ちょっとお手伝い・体験', desc: '片付けや収穫をプチ応援' },
                  { id: 'relocate', label: '移住・ワーケーション下見', desc: '地域のリアルな暮らしに触れる' }
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setInvolvement(item.id as MatchCriteria['involvement'])}
                    className={`p-2 rounded-xl text-xs border cursor-pointer transition-all ${
                      involvement === item.id
                        ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/30 font-bold text-amber-950'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{item.label}</span>
                      {involvement === item.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                      )}
                    </div>
                    <div className="text-[10px] text-stone-500 font-normal mt-0.5">
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Condition 4: Transport */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-2">
                ④ 主な移動手段
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'car', label: '車・レンタカー' },
                  { id: 'transit', label: '電車・バス・徒歩' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTransport(item.id as MatchCriteria['transport'])}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                      transport === item.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleMatch}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-700/20 active:scale-95 transition-all"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>この条件にマッチする催しを診断する</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        /* Matched Results View */
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-950">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                あなたのご希望条件にぴったりな地域の催しが <strong>{matchedResults.length}件</strong> 見つかりました！
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {matchedResults.map(({ event, score, matchReasons }, idx) => {
              const meta = CATEGORY_MAP[event.category] || CATEGORY_MAP.festival;
              const isTop = idx === 0;

              return (
                <div
                  key={event.id}
                  className={`bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-lg ${
                    isTop ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-stone-200'
                  }`}
                >
                  <div>
                    {/* Header Image with Match Badge */}
                    <div className="relative h-44 w-full overflow-hidden bg-stone-100">
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                      {/* Match Score Badge */}
                      <div className="absolute top-3 left-3 bg-amber-500 text-white font-black text-xs px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>マッチ度 {score}%</span>
                      </div>

                      {/* Category */}
                      <div className="absolute top-3 right-3 text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-stone-800 backdrop-blur-xs">
                        {meta.label}
                      </div>

                      {/* Date */}
                      <div className="absolute bottom-2.5 left-3 right-3 text-white">
                        <div className="text-[11px] text-emerald-200 flex items-center gap-1 mb-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{event.date}</span>
                        </div>
                        <h4 className="font-extrabold text-sm line-clamp-1 leading-snug">
                          {event.title}
                        </h4>
                      </div>
                    </div>

                    {/* Content & Match Reasons */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-1 text-xs text-stone-600">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{event.locationName}</span>
                      </div>

                      {/* Match Reasons Highlight Box */}
                      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5">
                        <div className="text-[10px] font-bold text-amber-900 mb-1 flex items-center gap-1">
                          <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />
                          <span>あなたへのおすすめポイント:</span>
                        </div>
                        <ul className="space-y-1">
                          {matchReasons.map((reason, rIdx) => (
                            <li key={rIdx} className="text-xs text-stone-700 flex items-start gap-1 leading-relaxed">
                              <span className="text-amber-500 font-bold">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Footprint Count */}
                      <div className="text-[11px] text-stone-500 flex items-center gap-1">
                        <Footprints className="w-3.5 h-3.5 text-amber-600" />
                        <span>過去参加者の足跡: <strong>{event.footprints.length}件</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 pt-0 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onViewOnMap(event)}
                        className="py-2 px-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700 flex items-center justify-center gap-1"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>地図で確認</span>
                      </button>
                      <button
                        onClick={() => onSelectEvent(event)}
                        className="py-2 px-2 rounded-xl bg-stone-900 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <span>詳細を見る</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => onPlanTrip(event)}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Compass className="w-3.5 h-3.5 text-emerald-600" />
                      <span>この催しから周遊コースを作る</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
