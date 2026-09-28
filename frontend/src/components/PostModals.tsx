import React, { useState } from 'react';
import { X, Footprints, Plus } from 'lucide-react';
import type { Region, Voice, Place } from '../types';

const Frame: React.FC<{ title: string; sub: string; onClose: () => void; children: React.ReactNode }> = ({
  title, sub, onClose, children,
}) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full sm:max-w-md max-h-[88vh] overflow-y-auto bg-[#14171B] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5">
      <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 grid place-items-center hover:bg-white/10">
        <X className="w-4 h-4" />
      </button>
      <h2 className="text-lg font-extrabold pr-10">{title}</h2>
      <p className="text-[11px] text-stone-500 mb-4">{sub}</p>
      {children}
    </div>
  </div>
);

const field = 'w-full bg-[#0E1013] border border-white/15 rounded-lg px-3 py-2.5 text-sm text-stone-100 placeholder:text-stone-600';
const label = 'block text-[11px] font-bold text-stone-400 mb-1.5';

/** 行った記録を足す。穴場の「外れではない根拠」は、この投稿が増えるほど厚くなる。 */
export const AddVoiceModal: React.FC<{
  regions: Region[]; open: boolean; onClose: () => void;
  onAdd: (regionId: string, v: Voice) => void;
}> = ({ regions, open, onClose, onAdd }) => {
  const [regionId, setRegionId] = useState(regions[0].id);
  const [name, setName] = useState('');
  const [from, setFrom] = useState('');
  const [text, setText] = useState('');
  const [tag, setTag] = useState('');
  const [rating, setRating] = useState(5);
  if (!open) return null;

  const submit = () => {
    if (!name.trim() || !text.trim()) return;
    onAdd(regionId, {
      id: `v-${Date.now()}`, name: name.trim(), from: from.trim() || '非公開',
      date: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
      text: text.trim(), tag: tag.trim() || '行ってきました', rating,
    });
    setName(''); setFrom(''); setText(''); setTag(''); setRating(5);
    onClose();
  };

  return (
    <Frame title="行った記録を残す" sub="次に迷っている人の判断材料になります" onClose={onClose}>
      <div className="space-y-3.5">
        <div>
          <label className={label}>どの町</label>
          <select value={regionId} onChange={(e) => setRegionId(e.target.value)} className={field}>
            {regions.map((r) => <option key={r.id} value={r.id}>{r.name}（{r.pref}）</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>名前</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ユウキ" className={field} /></div>
          <div><label className={label}>どこから</label>
            <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="東京・大学2年" className={field} /></div>
        </div>
        <div>
          <label className={label}>行ってどうだったか</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4}
            placeholder="期待してなかったけど、友達4人で行って全員また来たいって言ってた。" className={field} />
        </div>
        <div>
          <label className={label}>ひとことでいうと</label>
          <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="人が少ないのが正解" className={field} />
        </div>
        <div>
          <label className={label}>点数</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)}
                className={`w-10 h-10 rounded-lg text-sm font-bold border transition ${
                  rating === n ? 'bg-amber-400 border-amber-400 text-[#0E1013]' : 'border-white/15 text-stone-400'
                }`}>{n}</button>
            ))}
          </div>
        </div>
        <button onClick={submit} disabled={!name.trim() || !text.trim()}
          className="w-full inline-flex items-center justify-center gap-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-[#0E1013] text-sm font-bold py-3 rounded-xl">
          <Footprints className="w-4 h-4" />記録を残す
        </button>
      </div>
    </Frame>
  );
};

/** 地元の人が催しを載せる側。いまは旅行者側が主だが、拡張の入口として残す。 */
export const PostEventModal: React.FC<{
  regions: Region[]; open: boolean; onClose: () => void;
  onAdd: (regionId: string, p: Place) => void;
}> = ({ regions, open, onClose, onAdd }) => {
  const [regionId, setRegionId] = useState(regions[0].id);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [period, setPeriod] = useState('');
  const [tip, setTip] = useState('');
  const [stay, setStay] = useState(90);
  if (!open) return null;

  const submit = () => {
    if (!name.trim() || !desc.trim()) return;
    const r = regions.find((x) => x.id === regionId)!;
    onAdd(regionId, {
      id: `p-${Date.now()}`, name: name.trim(), kind: 'event', stay,
      desc: desc.trim(), tip: tip.trim() || undefined, period: period.trim() || undefined,
      lat: r.lat, lng: r.lng,
    });
    setName(''); setDesc(''); setPeriod(''); setTip(''); setStay(90);
    onClose();
  };

  return (
    <Frame title="催しを載せる" sub="地元の方が、自分の町の催しを直接載せられます" onClose={onClose}>
      <div className="space-y-3.5">
        <div>
          <label className={label}>どの町</label>
          <select value={regionId} onChange={(e) => setRegionId(e.target.value)} className={field}>
            {regions.map((r) => <option key={r.id} value={r.id}>{r.name}（{r.pref}）</option>)}
          </select>
        </div>
        <div><label className={label}>催しの名前</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="蔵の朝市" className={field} /></div>
        <div><label className={label}>どんな催しか</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
            placeholder="毎月第3日曜の朝だけ、蔵の前に近隣の農家が並びます。" className={field} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>いつ</label>
            <input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="10月の第3日曜" className={field} /></div>
          <div><label className={label}>滞在の目安（分）</label>
            <input type="number" min={15} step={15} value={stay} onChange={(e) => setStay(+e.target.value)} className={field} /></div>
        </div>
        <div><label className={label}>来る人へのひとこと</label>
          <input value={tip} onChange={(e) => setTip(e.target.value)} placeholder="9時までに来ると良いものが残っています" className={field} /></div>
        <button onClick={submit} disabled={!name.trim() || !desc.trim()}
          className="w-full inline-flex items-center justify-center gap-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-[#0E1013] text-sm font-bold py-3 rounded-xl">
          <Plus className="w-4 h-4" />この催しを載せる
        </button>
      </div>
    </Frame>
  );
};
