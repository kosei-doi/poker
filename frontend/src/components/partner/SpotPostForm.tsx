import { CircleCheck, TriangleAlert } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { townById } from '../../data/towns';
import {
  EMPTY_DRAFT,
  LIMITS,
  POSTED_ID_PREFIX,
  POST_FIELD_LABEL,
  SPOT_KINDS,
  validatePost,
  type PostDraft,
  type PostField,
} from '../../lib/partner';
import { toHash } from '../../lib/route';
import { useApp } from '../../state/context';
import type { SpotId, TownId } from '../../types';
import { LocationPicker } from './LocationPicker';
import { KIND_ICON, PostPhotoPicker } from './PostPhotoPicker';

interface Props {
  townId: TownId;
  /** 写真の表示（PostPhotoPicker にそのまま渡す） */
  renderThumb?: (spotId: SpotId) => ReactNode;
}

const FIELD_ORDER: PostField[] = ['name', 'kind', 'description', 'stayMin', 'costYen', 'location', 'photo'];
/** 各項目でフォーカスを受ける要素の id（誤りの一覧のリンク先） */
const FIELD_ID: Record<PostField, string> = {
  name: 'post-name',
  kind: 'post-kind',
  description: 'post-description',
  stayMin: 'post-stay',
  costYen: 'post-cost',
  location: 'post-location',
  photo: 'post-photo',
};
const errorId = (f: PostField) => `${FIELD_ID[f]}-error`;

const inputClass = (invalid: boolean) =>
  `w-full rounded-lg border bg-panel-2 px-3 py-2 text-sm outline-none focus:border-glow/70 ${
    invalid ? 'border-danger' : 'border-line'
  }`;

function newPostedId(): string {
  return `${POSTED_ID_PREFIX}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function focusField(f: PostField) {
  const el = document.getElementById(FIELD_ID[f]);
  el?.focus();
  el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function FieldError({ field, message }: { field: PostField; message?: string }) {
  if (!message) return null;
  return (
    <p id={errorId(field)} className="flex items-start gap-1 text-xs text-danger">
      <TriangleAlert size={13} className="mt-0.5 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

/** スポットを投稿する（N6-2）。町が変わったら key で作り直す前提 */
export function SpotPostForm({ townId, renderThumb }: Props) {
  const { state, dispatch } = useApp();
  const [draft, setDraft] = useState<PostDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<Partial<Record<PostField, string>>>({});
  const [done, setDone] = useState(false);
  const [focusTick, setFocusTick] = useState(0);
  const town = townById(townId);

  // 送信に失敗したら、最初の誤りの項目にフォーカスを移す
  useEffect(() => {
    if (focusTick === 0) return;
    const first = FIELD_ORDER.find((f) => errors[f]);
    if (first) focusField(first);
    // errors は送信のときだけ見ればよいので依存に入れない
  }, [focusTick]);

  const set = (field: PostField, patch: Partial<PostDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDone(false);
    if (errors[field]) {
      setErrors((e) => {
        const next = { ...e };
        delete next[field];
        return next;
      });
    }
  };

  const onSubmit = () => {
    const r = validatePost(draft, townId, state.postedSpots);
    if (!r.ok) {
      setErrors(r.errors);
      setDone(false);
      setFocusTick((n) => n + 1);
      return;
    }
    dispatch({ type: 'POST_SPOT', spot: { ...r.spot, id: newPostedId(), createdAt: new Date().toISOString() } });
    setDraft(EMPTY_DRAFT);
    setErrors({});
    setDone(true);
  };

  const errorFields = FIELD_ORDER.filter((f) => errors[f]);
  const aria = (f: PostField) => ({
    'aria-invalid': errors[f] ? true : undefined,
    'aria-describedby': errors[f] ? errorId(f) : undefined,
  });

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-5 rounded-xl border border-line bg-panel p-4"
      aria-labelledby="post-form-title"
    >
      <h2 id="post-form-title" className="text-base font-bold">
        {town?.name}のスポットを投稿する
      </h2>

      {errorFields.length > 0 && (
        <div className="rounded-lg border border-danger bg-panel-2 p-3 fade-in">
          <p className="flex items-center gap-1.5 text-sm font-bold text-danger">
            <TriangleAlert size={15} aria-hidden />
            {errorFields.length}か所を直してください
          </p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm">
            {errorFields.map((f) => (
              <li key={f}>
                {/* ハッシュでページを移っているので、リンクの既定の動きは止めてフォーカスだけ移す */}
                <a
                  href={`#${FIELD_ID[f]}`}
                  onClick={(e) => {
                    e.preventDefault();
                    focusField(f);
                  }}
                  className="underline text-text hover:text-glow"
                >
                  {POST_FIELD_LABEL[f]}: {errors[f]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {done && (
        <div role="status" className="flex items-start gap-2 rounded-lg border border-glow/50 bg-panel-2 p-3 text-sm fade-in">
          <CircleCheck size={16} className="mt-0.5 shrink-0 text-glow" aria-hidden />
          <p>
            投稿しました。『さがす』の{town?.name}の詳細に出ます。{' '}
            <a href={toHash({ page: 'search', town: townId })} className="underline text-glow-soft">
              さがすで見る
            </a>
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor={FIELD_ID.name} className="block text-sm font-bold">
          名前
        </label>
        <input
          id={FIELD_ID.name}
          type="text"
          value={draft.name}
          onChange={(e) => set('name', { name: e.target.value })}
          className={inputClass(!!errors.name)}
          placeholder="例: 里山の朝市"
          autoComplete="off"
          {...aria('name')}
        />
        <p className="text-xs text-muted">
          {[...draft.name.trim()].length} / {LIMITS.nameMax}字
        </p>
        <FieldError field="name" message={errors.name} />
      </div>

      <fieldset className="space-y-1.5" {...aria('kind')}>
        <legend className="text-sm font-bold">種類</legend>
        <div className="flex flex-wrap gap-1.5">
          {SPOT_KINDS.map((k, i) => {
            const Icon = KIND_ICON[k];
            const checked = draft.kind === k;
            return (
              <label
                key={k}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-glow ${
                  checked ? 'border-glow bg-glow text-[#1c1300] font-bold' : errors.kind ? 'border-danger bg-panel-2' : 'border-line bg-panel-2'
                }`}
              >
                <input
                  type="radio"
                  name="post-kind"
                  id={i === 0 ? FIELD_ID.kind : undefined}
                  value={k}
                  checked={checked}
                  onChange={() =>
                    // 種類を変えたら写真は選び直し
                    set('kind', { kind: k, photoSpotId: draft.kind === k ? draft.photoSpotId : null })
                  }
                  className="sr-only"
                />
                <Icon size={14} aria-hidden />
                {k}
              </label>
            );
          })}
        </div>
        <FieldError field="kind" message={errors.kind} />
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor={FIELD_ID.description} className="block text-sm font-bold">
          説明
        </label>
        <textarea
          id={FIELD_ID.description}
          value={draft.description}
          onChange={(e) => set('description', { description: e.target.value })}
          rows={3}
          className={`${inputClass(!!errors.description)} resize-none`}
          placeholder="例: 地元の野菜とおにぎりが並ぶ小さな朝市。土日の朝だけ"
          {...aria('description')}
        />
        <p className="text-xs text-muted">
          {[...draft.description.trim()].length} / {LIMITS.descriptionMax}字
        </p>
        <FieldError field="description" message={errors.description} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={FIELD_ID.stayMin} className="block text-sm font-bold">
            滞在時間（分）
          </label>
          <input
            id={FIELD_ID.stayMin}
            type="text"
            inputMode="numeric"
            value={draft.stayMin}
            onChange={(e) => set('stayMin', { stayMin: e.target.value })}
            className={inputClass(!!errors.stayMin)}
            placeholder={`${LIMITS.stayMin}〜${LIMITS.stayMax}`}
            {...aria('stayMin')}
          />
          <FieldError field="stayMin" message={errors.stayMin} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={FIELD_ID.costYen} className="block text-sm font-bold">
            費用の目安（円・1人）
          </label>
          <input
            id={FIELD_ID.costYen}
            type="text"
            inputMode="numeric"
            value={draft.costYen}
            onChange={(e) => set('costYen', { costYen: e.target.value })}
            className={inputClass(!!errors.costYen)}
            placeholder="無料なら 0"
            {...aria('costYen')}
          />
          <FieldError field="costYen" message={errors.costYen} />
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-bold">場所</p>
        <p className="text-xs text-muted">地図を押して選びます（町の境界の外は選べません）</p>
        <LocationPicker
          townId={townId}
          value={draft.location}
          onChange={(location) => set('location', { location })}
          invalid={!!errors.location}
          describedBy={errors.location ? errorId('location') : undefined}
          buttonId={FIELD_ID.location}
        />
        <FieldError field="location" message={errors.location} />
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-bold">写真</p>
        <p className="text-xs text-muted">種類が同じスポットの写真から選びます</p>
        <PostPhotoPicker
          kind={draft.kind}
          value={draft.photoSpotId}
          onChange={(photoSpotId) => set('photo', { photoSpotId })}
          renderThumb={renderThumb}
          firstId={FIELD_ID.photo}
          invalid={!!errors.photo}
          describedBy={errors.photo ? errorId('photo') : undefined}
        />
        <FieldError field="photo" message={errors.photo} />
      </div>

      <div className="flex justify-end">
        <button type="submit" className="rounded-lg bg-glow px-5 py-2 text-sm font-bold text-[#1c1300]">
          投稿する
        </button>
      </div>
    </form>
  );
}
