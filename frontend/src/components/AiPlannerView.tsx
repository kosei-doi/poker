import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { AlertTriangle, Bus, Clock, Lightbulb, Loader2, RefreshCw, Sparkles, X } from 'lucide-react';
import type { PlanPreferences, Spot, TripPlan } from '../types';
import { AREA_CENTER, AREAS } from '../data/mockData';
import { spotPinIcon, useLeafletMap } from '../hooks/useLeafletMap';
import { CATEGORY_MAP } from '../utils/categoryHelpers';
import { requestPlan, type PlanResult } from '../utils/planApi';
import { inputCls } from '../utils/styles';
import { SpotImage } from './SpotImage';

interface AiPlannerViewProps {
  spots: Spot[];
  initialSpot: Spot | null;
  onSelectSpot: (spot: Spot) => void;
}

const INTERESTS = ['食', '自然', '絶景', '温泉', '体験', '歴史'];
const DURATIONS = ['日帰り', '1泊2日', '2泊3日'];
const COMPANIONS = ['ひとり', '友人', 'カップル', '家族（子連れ）'];
const PACES = ['ゆったり', 'ふつう', 'よくばり'];
const TRANSPORTS = ['車', '電車・バス', '自転車'];

const LOADING_MESSAGES = [
  '地元の人の投稿を読んでいます…',
  '足跡から「穴場度」を分析しています…',
  '移動時間とおすすめの時間帯を調整しています…',
  'あなただけの旅程を組み立てています…',
];

export const AiPlannerView: React.FC<AiPlannerViewProps> = ({ spots, initialSpot, onSelectSpot }) => {
  const [prefs, setPrefs] = useState<PlanPreferences>({
    area: initialSpot?.area ?? 'すべて',
    duration: '日帰り',
    interests: ['食', '自然'],
    companion: 'ひとり',
    pace: 'ふつう',
    transport: '車',
    note: '',
    mustIncludeSpotId: initialSpot?.id,
  });
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<PlanResult | null>(null);

  const mustSpot = spots.find((s) => s.id === prefs.mustIncludeSpotId) ?? null;
  const set = <K extends keyof PlanPreferences>(key: K, value: PlanPreferences[K]) => setPrefs((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setLoadingStep((s) => (s + 1) % LOADING_MESSAGES.length), 2200);
    return () => clearInterval(id);
  }, [loading]);

  const generate = async () => {
    setLoading(true);
    setLoadingStep(0);
    setResult(null);
    setResult(await requestPlan(prefs, spots));
    setLoading(false);
  };

  const toggleInterest = (i: string) =>
    set('interests', prefs.interests.includes(i) ? prefs.interests.filter((x) => x !== i) : [...prefs.interests, i]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* 条件フォーム */}
      <section className="lg:col-span-4 bg-white rounded-2xl border border-stone-200 p-5 space-y-4 h-fit lg:sticky lg:top-20">
        <div>
          <h2 className="font-extrabold text-stone-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600" />
            AI旅プラン
          </h2>
          <p className="text-xs text-stone-500 mt-1">地元の人が投稿した穴場と足跡をもとに、Claude があなた専用の旅程を提案します。</p>
        </div>

        {mustSpot && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-violet-50 border border-violet-200 text-xs">
            <span className="font-bold text-violet-800 flex-1">📌 必ず行く：{mustSpot.name}</span>
            <button onClick={() => set('mustIncludeSpotId', undefined)} aria-label="解除">
              <X className="w-4 h-4 text-violet-500" />
            </button>
          </div>
        )}

        <Choice label="エリア" options={['すべて', ...AREAS]} value={prefs.area} onChange={(v) => set('area', v)} />
        <Choice label="日程" options={DURATIONS} value={prefs.duration} onChange={(v) => set('duration', v)} />

        <div>
          <p className="text-xs font-bold text-stone-700 mb-1.5">興味のあること（複数OK）</p>
          <div className="flex flex-wrap gap-1.5">
            {INTERESTS.map((i) => (
              <button
                key={i}
                onClick={() => toggleInterest(i)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                  prefs.interests.includes(i) ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-stone-600 border-stone-200'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <Choice label="だれと" options={COMPANIONS} value={prefs.companion} onChange={(v) => set('companion', v)} />
        <Choice label="ペース" options={PACES} value={prefs.pace} onChange={(v) => set('pace', v)} />
        <Choice label="移動手段" options={TRANSPORTS} value={prefs.transport} onChange={(v) => set('transport', v)} />

        <label className="block">
          <span className="block text-xs font-bold text-stone-700 mb-1">ほかに希望があれば</span>
          <textarea
            rows={2}
            value={prefs.note}
            onChange={(e) => set('note', e.target.value)}
            placeholder="例：朝早いのは苦手／地元の人と話したい／雨予報"
            className={inputCls}
          />
        </label>

        <button
          onClick={generate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 disabled:opacity-60 text-white font-extrabold shadow-lg"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {loading ? 'プランを作成中…' : result ? '条件を変えて作り直す' : '旅プランを作る'}
        </button>
      </section>

      {/* 結果 */}
      <section className="lg:col-span-8 space-y-4">
        {loading && (
          <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-violet-600 animate-pulse" />
            </div>
            <p className="font-bold text-stone-800">{LOADING_MESSAGES[loadingStep]}</p>
            <p className="text-xs text-stone-500 mt-1">数十秒ほどかかることがあります</p>
          </div>
        )}

        {!loading && !result && (
          <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-2xl border border-violet-100 p-10 text-center">
            <p className="text-4xl mb-3">🗺️</p>
            <p className="font-bold text-stone-800">条件を選んで「旅プランを作る」を押してください</p>
            <p className="text-xs text-stone-500 mt-1">地元の人の足跡が多い、まだ知られていない場所を優先して組み立てます。</p>
          </div>
        )}

        {!loading && result && <PlanResultView result={result} spots={spots} onSelectSpot={onSelectSpot} onRetry={generate} />}
      </section>
    </div>
  );
};

const Choice: React.FC<{ label: string; options: string[]; value: string; onChange: (v: string) => void }> = ({ label, options, value, onChange }) => (
  <div>
    <p className="text-xs font-bold text-stone-700 mb-1.5">{label}</p>
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
            value === o ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  </div>
);

const PlanResultView: React.FC<{ result: PlanResult; spots: Spot[]; onSelectSpot: (s: Spot) => void; onRetry: () => void }> = ({
  result,
  spots,
  onSelectSpot,
  onRetry,
}) => {
  const { plan } = result;
  const spotById = useMemo(() => new Map(spots.map((s) => [s.id, s])), [spots]);

  return (
    <>
      {result.source === 'demo' && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <b>デモモードで作成しました</b>（AIサーバーに接続できなかったため、穴場度をもとにした簡易生成です）
            <p className="text-amber-700 mt-0.5">理由：{result.reason}</p>
          </div>
          <button onClick={onRetry} className="flex items-center gap-1 font-bold text-amber-800 hover:underline shrink-0">
            <RefreshCw className="w-3.5 h-3.5" />再試行
          </button>
        </div>
      )}

      <div className="bg-gradient-to-br from-violet-700 to-fuchsia-700 text-white rounded-2xl p-5 sm:p-6">
        <p className="text-[11px] font-bold tracking-widest text-violet-200 mb-1">
          {result.source === 'ai' ? '✨ GENERATED BY CLAUDE' : 'DEMO PLAN'}
        </p>
        <h2 className="text-xl sm:text-2xl font-extrabold leading-snug">{plan.title}</h2>
        <p className="text-sm text-violet-50/90 mt-2 leading-relaxed">{plan.summary}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {plan.highlights.map((h) => (
            <span key={h} className="text-[11px] font-semibold bg-white/15 px-2.5 py-1 rounded-full">{h}</span>
          ))}
        </div>
      </div>

      <RouteMap plan={plan} spotById={spotById} />

      {plan.days.map((day) => (
        <div key={day.day} className="bg-white rounded-2xl border border-stone-200 p-5">
          <h3 className="font-extrabold text-stone-900 mb-4">
            <span className="text-violet-600 mr-2">DAY {day.day}</span>{day.theme}
          </h3>
          <ol className="relative border-l-2 border-dashed border-violet-200 ml-3 space-y-5">
            {day.items.map((item, i) => {
              const spot = item.spotId ? spotById.get(item.spotId) : undefined;
              return (
                <li key={i} className="ml-5">
                  <span
                    className="absolute -left-[11px] w-5 h-5 rounded-full border-2 border-white shadow flex items-center justify-center text-[10px]"
                    style={{ background: spot ? CATEGORY_MAP[spot.category].pinBg : '#a8a29e' }}
                  />
                  {item.transport && (
                    <p className="text-[11px] text-stone-400 flex items-center gap-1 mb-1">
                      <Bus className="w-3 h-3" />{item.transport}
                    </p>
                  )}
                  <div className="flex gap-3">
                    {spot && (
                      <button onClick={() => onSelectSpot(spot)} className="shrink-0 w-20 h-20 rounded-xl overflow-hidden">
                        <SpotImage spot={spot} className="w-full h-full object-cover" />
                      </button>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-violet-700 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{item.time}〜（{item.durationMin}分）
                      </p>
                      {spot ? (
                        <button onClick={() => onSelectSpot(spot)} className="font-extrabold text-stone-900 hover:text-violet-700 text-left">
                          {CATEGORY_MAP[spot.category].emoji} {item.title}
                        </button>
                      ) : (
                        <p className="font-extrabold text-stone-900">{item.title}</p>
                      )}
                      <p className="text-sm text-stone-600 leading-relaxed">{item.description}</p>
                      {item.localTip && (
                        <p className="mt-1.5 text-xs text-emerald-900 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5 flex gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
                          {item.localTip}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ))}

      {plan.tips.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <h3 className="font-extrabold text-stone-900 mb-2">旅のヒント</h3>
          <ul className="space-y-1.5 text-sm text-stone-700 list-disc list-inside">
            {plan.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

/** プランに登場するスポットを順番に線でつないだ地図 */
const RouteMap: React.FC<{ plan: TripPlan; spotById: Map<string, Spot> }> = ({ plan, spotById }) => {
  const { containerRef, map } = useLeafletMap(AREA_CENTER['すべて'], 10);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map) return;
    layerRef.current?.remove();
    const layer = L.layerGroup().addTo(map);
    layerRef.current = layer;

    const dayColors = ['#7c3aed', '#db2777', '#0891b2'];
    const all: L.LatLngExpression[] = [];
    let n = 0;
    plan.days.forEach((day, d) => {
      const points: L.LatLngExpression[] = [];
      for (const item of day.items) {
        const spot = item.spotId ? spotById.get(item.spotId) : undefined;
        if (!spot) continue;
        n++;
        points.push([spot.lat, spot.lng]);
        L.marker([spot.lat, spot.lng], { icon: spotPinIcon(dayColors[d % dayColors.length], String(n)) })
          .bindTooltip(`${item.time} ${spot.name}`)
          .addTo(layer);
      }
      if (points.length > 1) {
        L.polyline(points, { color: dayColors[d % dayColors.length], weight: 4, opacity: 0.7, dashArray: '8 8' }).addTo(layer);
      }
      all.push(...points);
    });
    if (all.length > 0) map.fitBounds(L.latLngBounds(all), { padding: [40, 40], maxZoom: 14 });
  }, [map, plan, spotById]);

  return <div ref={containerRef} className="h-64 sm:h-80 rounded-2xl overflow-hidden border border-stone-200" />;
};
