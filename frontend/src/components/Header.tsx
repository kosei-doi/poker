import { Menu, RotateCcw, Sparkles, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toHash } from '../lib/route';
import { useReset } from '../state/useReset';
import { useRoute } from '../state/useRoute';
import { MobileMenu } from './nav/MobileMenu';
import { NavLinks } from './nav/NavLinks';

/** 全ページ共通のヘッダー（N2-1・N2-3・B5）。高さは1行（h-14）。5つのリンクが1行に収まらない幅（< 1024px）はメニューボタンにする */
export function Header() {
  const reset = useReset();
  const route = useRoute();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  }, []);

  // ページが変わったらメニューを閉じる
  useEffect(() => {
    setOpen(false);
  }, [route.page]);

  return (
    <header className="sticky top-0 z-[1500] flex items-center justify-between gap-3 px-4 h-14 border-b border-line bg-ink/95 backdrop-blur shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <a href={toHash({ page: 'dashboard' })} className="flex items-center gap-2 min-w-0" aria-label="穴場（ダッシュボードへ）">
          <Sparkles className="text-glow shrink-0" size={22} aria-hidden />
          <span className="font-extrabold text-lg leading-none tracking-wide">穴場</span>
        </a>
        <span className="hidden xl:inline ml-1 shrink-0 rounded border border-glow/50 text-glow-soft text-[11px] px-1.5 py-0.5">
          サンプルデータ
        </span>
      </div>

      <nav aria-label="ページ" className="hidden lg:block">
        <NavLinks current={route.page} layout="row" />
      </nav>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 lg:px-3 py-1.5 text-sm text-muted hover:text-text hover:border-muted"
          title="初期データに戻す"
          aria-label="リセット（初期データに戻す）"
        >
          <RotateCcw size={15} aria-hidden />
          <span className="hidden lg:inline">リセット</span>
        </button>
        <button
          ref={buttonRef}
          type="button"
          className="lg:hidden grid place-items-center size-9 rounded-lg border border-line text-text"
          aria-label={open ? 'メニューを閉じる' : 'メニューを開く'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
        </button>
      </div>

      {open && <MobileMenu id="mobile-menu" current={route.page} onClose={close} buttonRef={buttonRef} />}
    </header>
  );
}
