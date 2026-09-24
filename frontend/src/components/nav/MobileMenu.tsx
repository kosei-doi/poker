import { useEffect, useRef, type RefObject } from 'react';
import type { Page } from '../../lib/route';
import { NavLinks } from './NavLinks';

interface Props {
  id: string;
  current: Page;
  onClose: (restoreFocus: boolean) => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
}

/** スマホのメニュー（N2-3）。ヘッダー直下に全幅で開く */
export function MobileMenu({ id, current, onClose, buttonRef }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    firstLinkRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(true);
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !buttonRef.current?.contains(t)) onClose(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [onClose, buttonRef]);

  return (
    <div
      id={id}
      ref={panelRef}
      className="lg:hidden absolute left-0 right-0 top-full z-[1500] bg-panel border-b border-line shadow-2xl fade-in"
    >
      <nav aria-label="ページ">
        <NavLinks current={current} layout="column" onNavigate={() => onClose(false)} firstLinkRef={firstLinkRef} />
      </nav>
      <p className="px-4 py-3 text-xs text-muted">
        <span className="rounded border border-glow/50 text-glow-soft px-1.5 py-0.5 mr-2">サンプルデータ</span>
        感想・費用・所要時間はサンプルです
      </p>
    </div>
  );
}
