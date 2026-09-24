import { Bot, SendHorizontal, User } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { EXAMPLES } from '../../data/examples';
import { useApp } from '../../state/context';
import { useConsultFlow } from '../../state/useConsultFlow';

/** 相談する（B1） */
export function ChatPanel() {
  const { state } = useApp();
  const { send } = useConsultFlow();
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [state.messages.length, state.consultPhase]);

  const submit = (value: string) => {
    if (!value.trim()) return;
    void send(value);
    setText('');
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(text);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit(text);
    }
  };

  return (
    <section aria-label="相談" className="space-y-3">
      {state.messages.length === 0 && (
        <div className="rounded-xl border border-line bg-panel-2/60 p-3 text-sm leading-relaxed">
          <p className="font-bold text-glow-soft">行き先、決まっていませんか？</p>
          <p className="text-muted mt-1">
            誰と・予算・雰囲気などを自由に書いてください。「京都の竹林みたいな」のように、知っている場所でたとえても探せます。
          </p>
        </div>
      )}

      <ol className="space-y-2" aria-live="polite">
        {state.messages.map((m) => (
          <li key={m.id} className={`flex gap-2 fade-in ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <span
              className={`shrink-0 grid place-items-center size-7 rounded-full ${
                m.role === 'user' ? 'bg-panel-2 text-muted' : 'bg-glow/20 text-glow'
              }`}
              aria-hidden
            >
              {m.role === 'user' ? <User size={15} /> : <Bot size={15} />}
            </span>
            <p
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                m.role === 'user' ? 'bg-glow text-[#1c1300] rounded-tr-sm' : 'bg-panel-2 border border-line rounded-tl-sm'
              }`}
            >
              <span className="sr-only">{m.role === 'user' ? 'あなた: ' : 'AI: '}</span>
              {m.text}
            </p>
          </li>
        ))}
        {state.consultPhase === 'thinking' && (
          <li className="flex gap-2">
            <span className="shrink-0 grid place-items-center size-7 rounded-full bg-glow/20 text-glow" aria-hidden>
              <Bot size={15} />
            </span>
            <p className="rounded-2xl px-3 py-2 text-sm bg-panel-2 border border-line text-muted">
              相談文を読んでいます<span className="animate-pulse">…</span>
            </p>
          </li>
        )}
      </ol>
      <div ref={endRef} />

      <div className="flex flex-wrap gap-2" aria-label="例文">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => submit(ex.text)}
            className="rounded-full border border-line bg-panel-2 px-3 py-1.5 text-xs text-text hover:border-glow/70 hover:text-glow-soft text-left"
            title={ex.text}
          >
            {ex.label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="flex items-end gap-2">
        <label className="sr-only" htmlFor="consult-input">
          相談文
        </label>
        <textarea
          id="consult-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          placeholder="例: 友達3人で日帰り、京都の竹林みたいな静かなとこ行きたい。予算は1万円くらい"
          className="flex-1 resize-none rounded-xl border border-line bg-panel-2 px-3 py-2 text-sm placeholder:text-muted/70 focus:border-glow/70 outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="grid place-items-center size-11 rounded-xl bg-glow text-[#1c1300] disabled:opacity-40"
          aria-label="送信"
        >
          <SendHorizontal size={18} />
        </button>
      </form>
    </section>
  );
}
