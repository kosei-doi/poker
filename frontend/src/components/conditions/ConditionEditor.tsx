import { useState, type ReactNode } from 'react';
import { FAMOUS_PLACES } from '../../data/famous';
import { COMPANIONS, TAGS, type Conditions, type Tag } from '../../types';

export type EditableField = 'companion' | 'partySize' | 'stay' | 'budgetYen' | 'maxOneWayMin' | 'moods' | 'famous';

interface Props {
  field: EditableField;
  conditions: Conditions;
  onApply: (next: Conditions) => void;
  onCancel: () => void;
}

const ONE_WAY_OPTIONS = [60, 90, 120, 150, 180];

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-xs ${active ? 'border-glow bg-glow text-[#1c1300] font-bold' : 'border-line bg-panel-2'}`}
    >
      {children}
    </button>
  );
}

/** 条件タグの編集（B2） */
export function ConditionEditor({ field, conditions, onApply, onCancel }: Props) {
  const [draft, setDraft] = useState<Conditions>(conditions);
  const set = (patch: Partial<Conditions>) => setDraft((d) => ({ ...d, ...patch }));
  const toggleMood = (t: Tag) =>
    set({ moods: TAGS.filter((x) => (x === t ? !draft.moods.includes(t) : draft.moods.includes(x))) });

  return (
    <div className="rounded-xl border border-glow/50 bg-panel-2 p-3 space-y-3 fade-in">
      {field === 'companion' && (
        <div className="flex flex-wrap gap-1.5">
          {COMPANIONS.map((c) => (
            <Choice key={c} active={draft.companion === c} onClick={() => set({ companion: c })}>
              {c}
            </Choice>
          ))}
          <Choice active={draft.companion === null} onClick={() => set({ companion: null })}>
            指定なし
          </Choice>
        </div>
      )}
      {field === 'partySize' && (
        <label className="flex items-center gap-2 text-sm">
          人数
          <input
            type="number"
            min={1}
            max={50}
            value={draft.partySize ?? ''}
            onChange={(e) => set({ partySize: e.target.value ? Math.max(1, Number(e.target.value)) : null })}
            className="w-20 rounded-lg border border-line bg-panel px-2 py-1"
          />
          人（空欄で指定なし。人数は絞り込みには使いません）
        </label>
      )}
      {field === 'stay' && (
        <div className="flex flex-wrap gap-1.5">
          {(['日帰り', '泊まり'] as const).map((s) => (
            <Choice key={s} active={draft.stay === s} onClick={() => set({ stay: s })}>
              {s}
            </Choice>
          ))}
          <Choice active={draft.stay === null} onClick={() => set({ stay: null })}>
            指定なし
          </Choice>
        </div>
      )}
      {field === 'budgetYen' && (
        <label className="flex flex-wrap items-center gap-2 text-sm">
          1人あたり
          <input
            type="number"
            min={0}
            step={1000}
            value={draft.budgetYen ?? ''}
            onChange={(e) => set({ budgetYen: e.target.value ? Math.max(0, Number(e.target.value)) : null })}
            className="w-28 rounded-lg border border-line bg-panel px-2 py-1"
          />
          円（空欄で指定なし）
        </label>
      )}
      {field === 'maxOneWayMin' && (
        <div className="flex flex-wrap gap-1.5">
          {ONE_WAY_OPTIONS.map((m) => (
            <Choice key={m} active={draft.maxOneWayMin === m} onClick={() => set({ maxOneWayMin: m })}>
              {m}分以内
            </Choice>
          ))}
          <Choice active={draft.maxOneWayMin === null} onClick={() => set({ maxOneWayMin: null })}>
            指定なし
          </Choice>
        </div>
      )}
      {field === 'moods' && (
        <div className="flex flex-wrap gap-1.5">
          {TAGS.map((t) => (
            <Choice key={t} active={draft.moods.includes(t)} onClick={() => toggleMood(t)}>
              #{t}
            </Choice>
          ))}
        </div>
      )}
      {field === 'famous' && (
        <div className="flex flex-wrap gap-1.5">
          {FAMOUS_PLACES.map((f) => (
            <Choice key={f.id} active={draft.famous?.id === f.id} onClick={() => set({ famous: f, unknownFamous: null })}>
              {f.name}
            </Choice>
          ))}
          <Choice active={draft.famous === null} onClick={() => set({ famous: null })}>
            なし
          </Choice>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-3 py-1.5 text-sm text-muted">
          やめる
        </button>
        <button
          type="button"
          onClick={() => onApply(draft)}
          className="rounded-lg bg-glow text-[#1c1300] font-bold px-3 py-1.5 text-sm"
        >
          この条件で探し直す
        </button>
      </div>
    </div>
  );
}
