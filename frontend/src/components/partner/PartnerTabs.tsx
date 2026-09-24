import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { PARTNER_TABS, type PartnerTab } from '../../lib/route';

interface Props {
  value: PartnerTab;
  onChange: (tab: PartnerTab) => void;
  children: ReactNode;
}

export const tabId = (tab: PartnerTab) => `partner-tab-${tab}`;
export const panelId = (tab: PartnerTab) => `partner-panel-${tab}`;

/** 投稿者ページの3つのタブ（N6-1）。左右キー・Home・End で移動する */
export function PartnerTabs({ value, onChange, children }: Props) {
  const refs = useRef(new Map<PartnerTab, HTMLButtonElement>());

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = PARTNER_TABS.findIndex((t) => t.tab === value);
    const n = PARTNER_TABS.length;
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = (i + 1) % n;
    else if (e.key === 'ArrowLeft') next = (i - 1 + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    if (next === null) return;
    e.preventDefault();
    const tab = PARTNER_TABS[next].tab;
    onChange(tab);
    refs.current.get(tab)?.focus();
  };

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="投稿者ページのタブ" className="flex gap-1 overflow-x-auto border-b border-line">
        {PARTNER_TABS.map(({ tab, label }) => {
          const selected = tab === value;
          return (
            <button
              key={tab}
              ref={(el) => {
                if (el) refs.current.set(tab, el);
                else refs.current.delete(tab);
              }}
              type="button"
              role="tab"
              id={tabId(tab)}
              aria-selected={selected}
              aria-controls={panelId(tab)}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab)}
              onKeyDown={onKeyDown}
              className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm -mb-px ${
                selected ? 'border-glow font-bold text-glow' : 'border-transparent text-muted hover:text-text'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={panelId(value)} aria-labelledby={tabId(value)} tabIndex={0} className="outline-none">
        {children}
      </div>
    </div>
  );
}
