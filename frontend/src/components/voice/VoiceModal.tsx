import { Loader2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { DEMO_VOICE } from '../../data/examples';
import { findSpot } from '../../lib/partner';
import { townById } from '../../data/towns';
import { KNOWN_LABEL, score } from '../../lib/format';
import { splitSentences } from '../../lib/text';
import { useApp } from '../../state/context';
import type { VoiceModalState } from '../../state/reducer';
import { useVoiceFlow } from '../../state/useVoiceFlow';
import { TAGS, type Known, type Satisfaction, type VoiceAnalysis, type VoiceChange } from '../../types';
import { Diff } from '../common/Diff';
import { Modal } from '../common/Modal';
import { TagChip } from '../common/TagChip';

/** 感想を書く（D2-1）。点数は表示しない */
function VoiceForm({ spotId, draft }: { spotId: string; draft: string }) {
  const { submit } = useVoiceFlow();
  const [text, setText] = useState(draft);
  return (
    <form
      id="voice-form"
      onSubmit={(e) => {
        e.preventDefault();
        void submit(spotId, text);
      }}
      className="space-y-3"
    >
      <label htmlFor="voice-text" className="block text-sm">
        行ってみてどうでしたか？ 自由に書いてください。
      </label>
      <textarea
        id="voice-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        autoFocus
        className="w-full resize-none rounded-xl border border-line bg-panel-2 px-3 py-2 text-sm focus:border-glow/70 outline-none"
        placeholder="例: 名前も知らなかったけど、竹の小道を独り占めできて最高。また来たい"
      />
      <button type="button" onClick={() => setText(DEMO_VOICE)} className="text-xs text-muted underline">
        デモ用の感想文を入れる
      </button>
    </form>
  );
}

/** AI の読み取り結果を見せて、直してから確定する（D2-2） */
function AnalysisReview({ spotId, text, analysis }: { spotId: string; text: string; analysis: VoiceAnalysis }) {
  const { confirm } = useVoiceFlow();
  const [draft, setDraft] = useState(analysis);
  const [touchedSat, setTouchedSat] = useState(false);
  const sentences = splitSentences(text);
  const evidenceOptions = sentences.includes(draft.evidence) ? sentences : [draft.evidence, ...sentences];
  const toggleTag = (t: (typeof TAGS)[number]) =>
    setDraft((d) => ({ ...d, tags: TAGS.filter((x) => (x === t ? !d.tags.includes(t) : d.tags.includes(x))) }));

  return (
    <form
      id="review-form"
      onSubmit={(e) => {
        e.preventDefault();
        void confirm(spotId, text, draft);
      }}
      className="space-y-4"
    >
      <p className="text-xs text-muted">AI が感想から読み取りました。違っていたら直してから確定してください。</p>
      <blockquote className="rounded-lg border border-line bg-panel-2/60 px-3 py-2 text-sm whitespace-pre-wrap">{text}</blockquote>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-bold">満足度（1〜5）</legend>
        <div className="flex gap-1.5">
          {([1, 2, 3, 4, 5] as Satisfaction[]).map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={draft.satisfaction === n}
              onClick={() => {
                setTouchedSat(true);
                setDraft((d) => ({ ...d, satisfaction: n }));
              }}
              className={`size-10 rounded-lg border font-bold ${
                draft.satisfaction === n ? 'bg-glow text-[#1c1300] border-glow' : 'border-line bg-panel-2'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        {!analysis.satisfactionDetermined && !touchedSat && (
          <p role="alert" className="flex items-center gap-1.5 text-sm text-danger">
            <TriangleAlert size={15} aria-hidden />
            判定できませんでした。直してください
          </p>
        )}
      </fieldset>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-bold">行く前に知っていたか</legend>
        <div className="flex flex-wrap gap-1.5">
          {(['known', 'unknown', 'unsure'] as Known[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={draft.known === k}
              onClick={() => setDraft((d) => ({ ...d, known: k }))}
              className={`rounded-full border px-3 py-1 text-sm ${
                draft.known === k ? 'bg-glow text-[#1c1300] border-glow font-bold' : 'border-line bg-panel-2'
              }`}
            >
              {KNOWN_LABEL[k]}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block space-y-1.5">
        <span className="text-sm font-bold">根拠になった文</span>
        <select
          value={draft.evidence}
          onChange={(e) => setDraft((d) => ({ ...d, evidence: e.target.value }))}
          className="w-full rounded-lg border border-line bg-panel-2 px-2 py-2 text-sm"
        >
          {evidenceOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-bold">特徴のタグ</legend>
        <div className="flex flex-wrap gap-1.5">
          {TAGS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={draft.tags.includes(t)}
              onClick={() => toggleTag(t)}
              className={`rounded-full border px-2.5 py-1 text-xs ${
                draft.tags.includes(t) ? 'bg-glow text-[#1c1300] border-glow font-bold' : 'border-line bg-panel-2 text-muted'
              }`}
            >
              #{t}
            </button>
          ))}
        </div>
      </fieldset>
    </form>
  );
}

/** 変化を見せる（D2-5） */
function ChangeSummary({ change, townName, spotName }: { change: VoiceChange; townName: string; spotName: string }) {
  const count = (n: number) => `n=${n}`;
  return (
    <div className="space-y-4">
      <p className="text-sm">声を確定しました。あなたの声で点数が変わりました。</p>
      <section className="space-y-1.5" aria-label="スポットの変化">
        <h3 className="text-sm font-bold">{spotName}</h3>
        <Diff label="穴場度" before={change.spot.hole[0]} after={change.spot.hole[1]} format={score} />
        <Diff label="件数" before={change.spot.count[0]} after={change.spot.count[1]} format={count} digits={0} />
        <Diff label="満足度" before={change.spot.satisfaction[0]} after={change.spot.satisfaction[1]} format={score} />
        <Diff
          label="知名度"
          before={change.spot.fame[0]}
          after={change.spot.fame[1]}
          format={score}
          higherIsBetter={false}
        />
      </section>
      <section className="space-y-1.5" aria-label="町の変化">
        <h3 className="text-sm font-bold">{townName}（町全体）</h3>
        <Diff label="穴場度" before={change.town.hole[0]} after={change.town.hole[1]} format={score} />
        <Diff label="件数" before={change.town.count[0]} after={change.town.count[1]} format={count} digits={0} />
      </section>
      <section className="space-y-1.5" aria-label="町の一言とタグ">
        <h3 className="text-sm font-bold">町の一言とタグ</h3>
        <p className="text-sm">
          {change.catchphrase[0] !== change.catchphrase[1] ? (
            <>
              <span className="text-muted line-through mr-2">{change.catchphrase[0]}</span>
              <span className="font-bold text-glow">{change.catchphrase[1]}</span>
            </>
          ) : (
            <span className="font-bold">{change.catchphrase[1]}</span>
          )}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {change.tags.map((t) => (
            <span key={t.tag} className="inline-flex items-center gap-1">
              <TagChip tag={t.tag} count={t.after} highlight={t.isNew ? 'new' : t.after > t.before ? 'up' : null} />
              {!t.isNew && t.after > t.before && <span className="text-xs text-glow-soft">+{t.after - t.before}</span>}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function footerFor(m: VoiceModalState, actions: ReturnType<typeof useVoiceFlow>) {
  const primary = 'rounded-lg bg-glow text-[#1c1300] font-bold px-4 py-2 text-sm';
  const secondary = 'rounded-lg px-4 py-2 text-sm text-muted';
  switch (m.step) {
    case 'writing':
      return (
        <div className="flex justify-end gap-2">
          <button type="button" className={secondary} onClick={actions.close}>
            やめる
          </button>
          <button type="submit" form="voice-form" className={primary}>
            送る
          </button>
        </div>
      );
    case 'analyzing':
      return null;
    case 'review':
      return (
        <div className="flex justify-end gap-2">
          <button type="button" className={secondary} onClick={() => actions.rewrite(m.spotId, m.text)}>
            書き直す
          </button>
          <button type="submit" form="review-form" className={primary}>
            この内容で確定
          </button>
        </div>
      );
    case 'result':
      return (
        <div className="flex justify-end">
          <button type="button" className={primary} onClick={actions.close}>
            閉じる
          </button>
        </div>
      );
  }
}

export function VoiceModal() {
  const { state } = useApp();
  const actions = useVoiceFlow();
  const m = state.voiceModal;
  if (!m) return null;
  const spot = findSpot(m.spotId, state.postedSpots);
  const town = spot && townById(spot.townId);
  if (!spot || !town) return null;
  return (
    <Modal title={`${spot.name}（${town.name}）の感想`} onClose={actions.close} footer={footerFor(m, actions)}>
      {m.step === 'writing' && <VoiceForm spotId={m.spotId} draft={m.draft} />}
      {m.step === 'analyzing' && (
        <div className="flex flex-col items-center gap-3 py-10 text-muted" role="status">
          <Loader2 className="animate-spin text-glow" size={28} aria-hidden />
          AI が感想を読み取っています…
        </div>
      )}
      {m.step === 'review' && <AnalysisReview spotId={m.spotId} text={m.text} analysis={m.analysis} />}
      {m.step === 'result' && <ChangeSummary change={m.change} townName={town.name} spotName={spot.name} />}
    </Modal>
  );
}
