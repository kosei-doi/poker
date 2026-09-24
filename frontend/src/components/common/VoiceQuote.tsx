import { useId, useState } from 'react';
import { dateLabel, KNOWN_LABEL } from '../../lib/format';
import { quoteText } from '../../lib/candidate';
import type { Voice } from '../../types';

/** 根拠の声の引用（D2-4）。押すと感想の原文が読める */
export function VoiceQuote({ voice, highlight = false }: { voice: Voice; highlight?: boolean }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={`rounded-lg border ${highlight ? 'border-glow/70 bg-glow/10' : 'border-line bg-panel-2/60'}`}>
      <button
        type="button"
        className="w-full text-left px-3 py-2 text-sm leading-relaxed"
        aria-expanded={open}
        aria-controls={id}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <span className="text-text">『{quoteText(voice.evidence)}』</span>
        <span className="block mt-1 text-[11px] text-muted">
          満足度 {voice.satisfaction}・{KNOWN_LABEL[voice.known]}・{dateLabel(voice.createdAt)}
          {voice.source === 'user' && <span className="ml-1 text-glow-soft">あなたの声</span>}
          <span className="ml-2 underline">{open ? '原文を閉じる' : '原文を読む'}</span>
        </span>
      </button>
      {open && (
        <p id={id} className="px-3 pb-3 text-sm text-muted whitespace-pre-wrap border-t border-line pt-2">
          {voice.text}
        </p>
      )}
    </div>
  );
}
