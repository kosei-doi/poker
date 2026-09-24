import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { Footprints, Gem, Maximize2, Sparkles } from 'lucide-react';
import type { Footprint, Spot } from '../types';
import { AREA_CENTER, AREAS } from '../data/mockData';
import { spotPinIcon, useLeafletMap } from '../hooks/useLeafletMap';
import { CATEGORY_MAP, FOOTPRINT_COLORS } from '../utils/categoryHelpers';
import { countFootprints, hiddenGemScore } from '../utils/spotStats';

interface FootprintMapViewProps {
  spots: Spot[];
  focusSpot: Spot | null;
  onSelectSpot: (spot: Spot) => void;
  onAddFootprint: (spot: Spot) => void;
}

type SideTab = 'feed' | 'ranking';

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export const FootprintMapView: React.FC<FootprintMapViewProps> = ({ spots, focusSpot, onSelectSpot, onAddFootprint }) => {
  const { containerRef, map } = useLeafletMap(AREA_CENTER['すべて'], 10);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const [area, setArea] = useState('すべて');
  const [showLocal, setShowLocal] = useState(true);
  const [showVisitor, setShowVisitor] = useState(true);
  const [showAura, setShowAura] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(focusSpot?.id ?? null);
  const [sideTab, setSideTab] = useState<SideTab>('feed');

  const visibleSpots = useMemo(() => (area === 'すべて' ? spots : spots.filter((s) => s.area === area)), [spots, area]);
  const activeSpot = spots.find((s) => s.id === activeId) ?? null;

  const feed = useMemo(() => {
    const list: { fp: Footprint; spot: Spot }[] = [];
    for (const spot of visibleSpots) {
      for (const fp of spot.footprints) {
        if ((fp.userType === 'local' && showLocal) || (fp.userType === 'visitor' && showVisitor)) list.push({ fp, spot });
      }
    }
    return list.sort((a, b) => b.fp.date.localeCompare(a.fp.date));
  }, [visibleSpots, showLocal, showVisitor]);

  const ranking = useMemo(
    () => [...visibleSpots].sort((a, b) => hiddenGemScore(b) - hiddenGemScore(a)).slice(0, 6),
    [visibleSpots],
  );

  const totals = visibleSpots.reduce(
    (acc, s) => {
      const c = countFootprints(s);
      return { local: acc.local + c.local, visitor: acc.visitor + c.visitor };
    },
    { local: 0, visitor: 0 },
  );
  const localPct = totals.local + totals.visitor === 0 ? 50 : Math.round((totals.local / (totals.local + totals.visitor)) * 100);

  // 地図レイヤーの描画
  useEffect(() => {
    if (!map) return;
    layerRef.current?.remove();
    const layer = L.layerGroup().addTo(map);
    layerRef.current = layer;

    for (const spot of visibleSpots) {
      const { local, visitor, total } = countFootprints(spot);
      const meta = CATEGORY_MAP[spot.category];

      // 足跡の多さと地元率を「オーラ」で表現（緑が濃いほど地元に愛されている）
      if (showAura && total > 0) {
        const ratio = local / total;
        L.circle([spot.lat, spot.lng], {
          radius: 250 + total * 90,
          stroke: false,
          fillColor: ratio >= 0.5 ? FOOTPRINT_COLORS.local : FOOTPRINT_COLORS.visitor,
          fillOpacity: 0.08 + Math.abs(ratio - 0.5) * 0.2,
          interactive: false,
        }).addTo(layer);
      }

      for (const fp of spot.footprints) {
        if ((fp.userType === 'local' && !showLocal) || (fp.userType === 'visitor' && !showVisitor)) continue;
        const color = FOOTPRINT_COLORS[fp.userType];
        L.polyline([[spot.lat, spot.lng], [fp.lat, fp.lng]], { color, weight: 1, opacity: 0.35, dashArray: '2 4', interactive: false }).addTo(layer);
        L.circleMarker([fp.lat, fp.lng], { radius: 6, color: 'white', weight: 2, fillColor: color, fillOpacity: 0.95 })
          .bindPopup(
            `<div style="padding:10px 12px;max-width:220px">
              <div style="font-size:11px;color:${color};font-weight:800">${fp.userType === 'local' ? '🏡 地元の人' : '🧳 旅人'}・${escapeHtml(fp.profile)}</div>
              <div style="font-size:12px;font-weight:700;margin:2px 0">${escapeHtml(fp.userName)} <span style="color:#f59e0b">${'★'.repeat(fp.rating)}</span></div>
              <div style="font-size:12px;color:#44403c">${escapeHtml(fp.comment)}</div>
              <div style="font-size:10px;color:#a8a29e;margin-top:4px">${fp.date}・${escapeHtml(spot.name)}</div>
            </div>`,
          )
          .addTo(layer);
      }

      L.marker([spot.lat, spot.lng], {
        icon: spotPinIcon(meta.pinBg, meta.emoji, { active: spot.id === activeId, badge: `${local}/${visitor}` }),
        zIndexOffset: spot.id === activeId ? 1000 : 500,
      })
        .on('click', () => setActiveId(spot.id))
        .addTo(layer);
    }
  }, [map, visibleSpots, showLocal, showVisitor, showAura, activeId]);

  // 外部（詳細モーダルなど）から指定されたスポットにフォーカス。
  // App 側で focusSpot ごとに key を変えて再マウントするので、初回だけでよい
  useEffect(() => {
    if (map && focusSpot) map.setView([focusSpot.lat, focusSpot.lng], 14);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  const changeArea = (next: string) => {
    setArea(next);
    map?.flyTo(AREA_CENTER[next], next === 'すべて' ? 10 : 12, { duration: 0.8 });
  };

  const focus = (spot: Spot) => {
    setActiveId(spot.id);
    map?.flyTo([spot.lat, spot.lng], 14, { duration: 0.8 });
  };

  const fitAll = () => {
    if (!map || visibleSpots.length === 0) return;
    map.fitBounds(L.latLngBounds(visibleSpots.map((s) => [s.lat, s.lng])), { padding: [40, 40] });
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー＆コントロール */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
        <div>
          <h2 className="font-extrabold text-stone-900 flex items-center gap-2">
            <Footprints className="w-5 h-5 text-amber-600" />
            みんなの足跡マップ
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">地元の人と旅人の足跡が重なる場所に、地域の新しいつながりが生まれています。</p>
          <div className="mt-2 flex items-center gap-2 text-[11px] font-bold">
            <span className="text-emerald-700">🏡 地元 {totals.local}</span>
            <div className="w-40 h-2 rounded-full overflow-hidden flex bg-stone-100">
              <div style={{ width: `${localPct}%`, background: FOOTPRINT_COLORS.local }} />
              <div style={{ width: `${100 - localPct}%`, background: FOOTPRINT_COLORS.visitor }} />
            </div>
            <span className="text-amber-700">🧳 旅人 {totals.visitor}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select value={area} onChange={(e) => changeArea(e.target.value)} className="text-xs font-semibold bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5">
            {['すべて', ...AREAS].map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <Toggle on={showLocal} onClick={() => setShowLocal((v) => !v)} color={FOOTPRINT_COLORS.local}>地元の足跡</Toggle>
          <Toggle on={showVisitor} onClick={() => setShowVisitor((v) => !v)} color={FOOTPRINT_COLORS.visitor}>旅人の足跡</Toggle>
          <Toggle on={showAura} onClick={() => setShowAura((v) => !v)} color="#78716c">にぎわい</Toggle>
          <button onClick={fitAll} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200">
            <Maximize2 className="w-3.5 h-3.5" />全体
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 地図 */}
        <div className="lg:col-span-8 relative h-[420px] lg:h-[560px] rounded-2xl overflow-hidden border border-stone-200 shadow-md">
          <div ref={containerRef} className="w-full h-full" />
          {activeSpot && (
            <div className="absolute z-[500] bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-stone-200">
              <p className="text-[11px] font-bold text-stone-500">
                {CATEGORY_MAP[activeSpot.category].emoji} {CATEGORY_MAP[activeSpot.category].label}・{activeSpot.area}・💎 穴場度 {hiddenGemScore(activeSpot)}
              </p>
              <h3 className="font-extrabold text-stone-900">{activeSpot.name}</h3>
              <p className="text-xs text-stone-600 line-clamp-2">{activeSpot.catchphrase}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => onSelectSpot(activeSpot)} className="py-2 rounded-lg bg-stone-900 text-white text-xs font-bold">詳しく見る</button>
                <button onClick={() => onAddFootprint(activeSpot)} className="py-2 rounded-lg bg-amber-500 text-white text-xs font-bold">👣 足跡を残す</button>
              </div>
            </div>
          )}
        </div>

        {/* サイドパネル */}
        <aside className="lg:col-span-4 bg-white rounded-2xl border border-stone-200 flex flex-col lg:h-[560px]">
          <div className="grid grid-cols-2 p-1.5 gap-1 border-b border-stone-100">
            <SideTabButton active={sideTab === 'feed'} onClick={() => setSideTab('feed')}>
              <Footprints className="w-3.5 h-3.5" />最新の足跡
            </SideTabButton>
            <SideTabButton active={sideTab === 'ranking'} onClick={() => setSideTab('ranking')}>
              <Gem className="w-3.5 h-3.5" />穴場ランキング
            </SideTabButton>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[420px] lg:max-h-none">
            {sideTab === 'feed' &&
              feed.map(({ fp, spot }) => (
                <button key={fp.id} onClick={() => focus(spot)} className="w-full text-left flex gap-2.5 p-2.5 rounded-xl hover:bg-stone-50 border border-transparent hover:border-stone-200">
                  <span className="mt-1 w-2.5 h-2.5 rounded-full shrink-0" style={{ background: FOOTPRINT_COLORS[fp.userType] }} />
                  <div className="min-w-0">
                    <p className="text-[11px] text-stone-500 truncate">
                      <b className="text-stone-800">{fp.userName}</b>（{fp.profile}）→ {spot.name}
                    </p>
                    <p className="text-xs text-stone-700 line-clamp-2">{fp.comment}</p>
                    <p className="text-[10px] text-stone-400">{fp.date}</p>
                  </div>
                </button>
              ))}

            {sideTab === 'ranking' && (
              <>
                <p className="text-[11px] text-stone-500 px-1 pb-1 flex items-start gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                  地元の人の足跡が多く、まだ旅人が少ない場所ほど上位に。次に行くならここ！
                </p>
                {ranking.map((spot, i) => {
                  const { local, visitor } = countFootprints(spot);
                  return (
                    <button key={spot.id} onClick={() => focus(spot)} className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl hover:bg-stone-50 border border-stone-100">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${i < 3 ? 'bg-violet-600 text-white' : 'bg-stone-100 text-stone-600'}`}>{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-stone-900 truncate">{CATEGORY_MAP[spot.category].emoji} {spot.name}</p>
                        <p className="text-[11px] text-stone-500">地元 {local}・旅人 {visitor}</p>
                      </div>
                      <span className="text-sm font-black text-violet-700">💎{hiddenGemScore(spot)}</span>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

const Toggle: React.FC<{ on: boolean; onClick: () => void; color: string; children: React.ReactNode }> = ({ on, onClick, color, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border ${on ? 'bg-white border-stone-300 text-stone-800' : 'bg-stone-50 border-stone-200 text-stone-400'}`}
  >
    <span className="w-2.5 h-2.5 rounded-full" style={{ background: on ? color : '#d6d3d1' }} />
    {children}
  </button>
);

const SideTabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold ${active ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'}`}
  >
    {children}
  </button>
);
