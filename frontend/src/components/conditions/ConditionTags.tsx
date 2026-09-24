import { ArrowRight, Pencil } from 'lucide-react';
import { useState } from 'react';
import { budgetLabel, hashTags } from '../../lib/format';
import { useApp } from '../../state/context';
import { useConsultFlow } from '../../state/useConsultFlow';
import type { Conditions } from '../../types';
import { ConditionEditor, type EditableField } from './ConditionEditor';

const NONE = '指定なし';

function fieldLabel(field: EditableField, c: Conditions): string {
  switch (field) {
    case 'companion':
      return c.companion ?? NONE;
    case 'partySize':
      return c.partySize !== null ? `${c.partySize}人` : NONE;
    case 'stay':
      return c.stay ?? NONE;
    case 'budgetYen':
      return c.budgetYen !== null ? `${budgetLabel(c.budgetYen)}（1人）` : NONE;
    case 'maxOneWayMin':
      return c.maxOneWayMin !== null ? `${c.maxOneWayMin}分以内` : NONE;
    case 'moods':
      return c.moods.length > 0 ? hashTags(c.moods) : NONE;
    case 'famous':
      return c.famous ? c.famous.name : 'なし';
  }
}

const FIELDS: { field: Exclude<EditableField, 'famous'>; title: string }[] = [
  { field: 'companion', title: '誰と' },
  { field: 'partySize', title: '人数' },
  { field: 'stay', title: '日帰り/泊まり' },
  { field: 'budgetYen', title: '予算' },
  { field: 'maxOneWayMin', title: '片道' },
  { field: 'moods', title: '雰囲気' },
];

/** 読み取った条件をタグで見せる（B2）＋有名地（D4-1）＋知らない有名地の1行（D4-3） */
export function ConditionTags() {
  const { state } = useApp();
  const { rerun } = useConsultFlow();
  const [editing, setEditing] = useState<EditableField | null>(null);
  const c = state.conditions;
  if (!c) return null;

  const apply = (next: Conditions) => {
    setEditing(null);
    void rerun(next);
  };

  return (
    <section aria-label="読み取った条件" className="space-y-2 fade-in">
      <h2 className="text-xs font-bold text-muted">読み取った条件（押すと直せます）</h2>
      <div className="flex flex-wrap gap-1.5">
        {FIELDS.map(({ field, title }) => {
          const value = fieldLabel(field, c);
          const empty = value === NONE;
          return (
            <button
              key={field}
              type="button"
              onClick={() => setEditing(editing === field ? null : field)}
              aria-expanded={editing === field}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${
                editing === field
                  ? 'border-glow bg-glow/15'
                  : empty
                    ? 'border-dashed border-line text-muted'
                    : 'border-line bg-panel-2'
              }`}
            >
              <span className="text-muted">{title}:</span>
              <span className={empty ? '' : 'font-bold'}>{value}</span>
              <Pencil size={11} className="text-muted" aria-hidden />
            </button>
          );
        })}
      </div>

      {c.famous ? (
        <button
          type="button"
          onClick={() => setEditing(editing === 'famous' ? null : 'famous')}
          aria-expanded={editing === 'famous'}
          className="flex flex-wrap items-center gap-1.5 rounded-lg border border-glow/60 bg-glow/10 px-3 py-1.5 text-sm text-left"
        >
          <span className="font-bold text-glow-soft">{c.famous.name}</span>
          <ArrowRight size={14} className="text-muted" aria-label="を体験のタグに変換" />
          <span className="font-bold">{hashTags(c.famous.tags)}</span>
          <Pencil size={11} className="text-muted" aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(editing === 'famous' ? null : 'famous')}
          className="text-xs text-muted underline"
        >
          有名地のたとえを足す
        </button>
      )}

      {c.unknownFamous && (
        <p className="text-xs text-glow-soft">『{c.unknownFamous}』はまだ対応していないので、ほかの条件で探しました</p>
      )}

      {editing && <ConditionEditor field={editing} conditions={c} onApply={apply} onCancel={() => setEditing(null)} />}
    </section>
  );
}
