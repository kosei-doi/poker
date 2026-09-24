import { Info } from 'lucide-react';
import { townById } from '../../data/towns';
import { PARTNER_TOWN_IDS } from '../../lib/partner';
import type { TownId } from '../../types';

interface Props {
  /** 5町のどれか。それ以外は未選択として扱う */
  value: TownId | null;
  onChange: (townId: TownId | null) => void;
}

/** 自分の町を選ぶ（N6-1）。ログインはしない */
export function PartnerTownSelect({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <label className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-bold">あなたの町</span>
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="min-w-0 max-w-full rounded-lg border border-line bg-panel-2 px-2 py-2 text-sm"
        >
          <option value="">選んでください</option>
          {PARTNER_TOWN_IDS.map((id) => (
            <option key={id} value={id}>
              {townById(id)?.name ?? id}
            </option>
          ))}
        </select>
      </label>
      <p className="flex items-start gap-1.5 text-xs text-muted">
        <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
        PoC のためログインはありません（だれでもどの町でも選べます）
      </p>
    </div>
  );
}
