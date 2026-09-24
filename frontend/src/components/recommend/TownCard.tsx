import { ChevronRight } from 'lucide-react';
import { townById } from '../../data/towns';
import type { CandidateView, FamousPlace } from '../../types';
import { ScoreBadge } from '../common/ScoreBadge';
import { TagChip } from '../common/TagChip';
import { VoiceQuote } from '../common/VoiceQuote';
import { hashTags } from '../../lib/format';

interface Props {
  view: CandidateView;
  rank?: number;
  famous: FamousPlace | null;
  onOpen?: () => void;
  /** 町のパネルではカード全体を押せなくする */
  interactive?: boolean;
}

/** 似た体験ができる理由（D4-2）。「同じ」「代わり」とは書かない */
export function FamousMatch({ view, famous }: { view: CandidateView; famous: FamousPlace }) {
  if (view.matchedTags.length === 0) return null;
  return (
    <div className="rounded-lg border border-glow/40 bg-glow/5 px-3 py-2 text-sm space-y-1">
      <p className="font-bold text-glow-soft">{famous.name}に似た体験ができる</p>
      <p className="text-text">
        <span className="font-bold">{hashTags(view.matchedTags)}</span> が一致。
        {view.famousEvidence && <span>『{view.famousEvidence.evidence}』</span>}
      </p>
    </div>
  );
}

/** 提案カード（B3・D2-3・D2-4・D4-2・D5） */
export function TownCard({ view, rank, famous, onOpen, interactive = true }: Props) {
  const town = townById(view.townId)!;
  const matched = new Set(view.matchedTags);
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted">
            {rank !== undefined && <span className="font-bold text-glow mr-1">{rank}</span>}
            {town.name}
          </p>
          <h3 className="text-lg font-extrabold leading-tight">{view.summary.catchphrase}</h3>
        </div>
        {interactive && <ChevronRight className="text-muted shrink-0 mt-2" size={18} aria-hidden />}
      </div>
      <div className="flex flex-wrap gap-1">
        {view.summary.tags.map((t) => (
          <TagChip key={t.tag} tag={t.tag} count={t.count} highlight={matched.has(t.tag) ? 'match' : null} size="sm" />
        ))}
      </div>
      <ScoreBadge hole={view.stats.hole} count={view.stats.count} />
      {famous && <FamousMatch view={view} famous={famous} />}
      {view.reasonText && <p className="text-sm text-text/90">{view.reasonText}</p>}
      {view.quotes.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-muted">根拠の声</p>
          {view.quotes.map((q) => (
            <VoiceQuote key={q.id} voice={q} highlight={q.source === 'user'} />
          ))}
        </div>
      )}
    </>
  );
  if (!interactive) return <div className="space-y-2.5">{body}</div>;
  return (
    <article
      className="rounded-2xl border border-glow/40 bg-panel-2/70 p-3 space-y-2.5 shadow-[0_0_24px_rgb(251_191_36/0.08)] fade-in cursor-pointer hover:border-glow"
      onClick={onOpen}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
          e.preventDefault();
          onOpen?.();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`${town.name}を詳しく見る`}
    >
      {body}
    </article>
  );
}
