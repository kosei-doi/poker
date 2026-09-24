import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * 背景は不透明（D2-1 で背後の点数を見せないため）。スマホでは全画面のシート。
 */
export function Modal({ title, onClose, children, footer }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    // 中の入力欄が autoFocus で先にフォーカスを取っていれば、それを残す
    if (!ref.current?.contains(document.activeElement)) ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[2000] bg-ink flex items-stretch sm:items-center justify-center sm:p-6">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="w-full sm:max-w-xl bg-panel sm:rounded-2xl sm:border sm:border-line flex flex-col max-h-full outline-none"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line">
          <h2 className="font-bold text-base">{title}</h2>
          <button type="button" onClick={onClose} className="p-2 -m-2 text-muted hover:text-text" aria-label="閉じる">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer && <div className="px-4 py-3 border-t border-line">{footer}</div>}
      </div>
    </div>
  );
}
