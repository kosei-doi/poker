import { dateLabel, KNOWN_LABEL } from '../../lib/format';
import type { MyVoiceRow } from '../../lib/dashboard';
import { toHash } from '../../lib/route';
import { TagChip } from '../common/TagChip';

/** あなたの声（N3-1）。行全体が「さがす」でその町を開くリンク */
export function MyVoiceList({ rows }: { rows: MyVoiceRow[] }) {
  return (
    <section aria-labelledby="dash-my-voices" className="space-y-2">
      <h2 id="dash-my-voices" className="text-base font-extrabold">あなたの声</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">まだありません</p>
      ) : (
        <ul className="space-y-2">
          {rows.map(({ voice, town, spot, excerpt }) => (
            <li key={voice.id}>
              <a
                href={toHash({ page: 'search', town: town.id })}
                className="block rounded-xl border border-line bg-panel px-3 py-2.5 space-y-1.5 hover:border-glow/60 fade-in"
                aria-label={`${town.name}・${spot.name}の声（${dateLabel(voice.createdAt)}）。さがすで${town.name}を開く`}
              >
                <p className="text-xs text-muted">
                  {town.name}
                  <span className="mx-1" aria-hidden>・</span>
                  <span className="font-bold text-text">{spot.name}</span>
                </p>
                <p className="text-sm text-text leading-relaxed">{excerpt}</p>
                <p className="text-[11px] text-muted">
                  満足度 {voice.satisfaction}・{KNOWN_LABEL[voice.known]}・<time dateTime={voice.createdAt}>{dateLabel(voice.createdAt)}</time>
                </p>
                {voice.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {voice.tags.map((t) => (
                      <TagChip key={t} tag={t} size="sm" />
                    ))}
                  </div>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
