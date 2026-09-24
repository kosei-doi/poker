import type { Ref } from 'react';
import { pageHome, PAGES, toHash, type Page } from '../../lib/route';

const hrefFor = (page: Page) => toHash(pageHome(page));

interface Props {
  current: Page;
  layout: 'row' | 'column';
  onNavigate?: () => void;
  firstLinkRef?: Ref<HTMLAnchorElement>;
}

/** 4つのページへのリンク（N2-1）。今いるページは aria-current と下線で強調 */
export function NavLinks({ current, layout, onNavigate, firstLinkRef }: Props) {
  return (
    <ul className={layout === 'row' ? 'flex items-center gap-1' : 'flex flex-col'}>
      {PAGES.map(({ page, label }, i) => {
        const active = page === current;
        const base =
          layout === 'row'
            ? 'relative block px-3 py-2 text-sm rounded-lg hover:text-text'
            : 'block px-4 py-3 text-base border-b border-line hover:bg-panel-2';
        const tone = active
          ? layout === 'row'
            ? 'text-glow font-bold after:absolute after:left-3 after:right-3 after:-bottom-0.5 after:h-0.5 after:rounded after:bg-glow'
            : 'text-glow font-bold bg-glow/10'
          : 'text-muted';
        return (
          <li key={page}>
            <a
              ref={i === 0 ? firstLinkRef : undefined}
              href={hrefFor(page)}
              aria-current={active ? 'page' : undefined}
              className={`${base} ${tone}`}
              onClick={onNavigate}
            >
              {label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
