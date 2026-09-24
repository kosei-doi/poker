import { ExternalLink } from 'lucide-react';
import type { ReactNode } from 'react';
import { PHOTO_CREDITS, photoTargetLabel, type PhotoCredit } from '../../data/photos';
import { PhotoListNote } from './PhotoListNote';
import { SpotPhoto } from './SpotPhoto';
import { TownPhoto } from './TownPhoto';

// 使い方: <PhotoCredits headingLevel={3} />（見出し「写真の出典」の階層を置き場所に合わせて選ぶ）

/** 入手元のサイト名（例: 'Wikimedia Commons'） */
function sourceName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (host.endsWith('wikimedia.org')) return 'Wikimedia Commons';
    if (host.endsWith('unsplash.com')) return 'Unsplash';
    if (host.endsWith('pexels.com')) return 'Pexels';
    return host;
  } catch {
    return url;
  }
}

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 text-glow-soft underline underline-offset-2 hover:text-glow"
    >
      {children}
      <ExternalLink size={11} className="shrink-0" aria-hidden />
      <span className="sr-only">（新しいタブで開く）</span>
    </a>
  );
}

function Thumb({ c }: { c: PhotoCredit }) {
  return c.target.kind === 'town' ? (
    <TownPhoto townId={c.target.id} size="thumb" />
  ) : (
    <SpotPhoto spotId={c.target.id} size="thumb" />
  );
}

const Author = ({ c }: { c: PhotoCredit }) => (c.authorUrl ? <Ext href={c.authorUrl}>{c.author}</Ext> : <>{c.author}</>);

/** 写真の出典の一覧（N5-5）。PC は表、スマホは行ごとのカード（hidden で出し分けるので二重には読まれない） */
export function PhotoCredits({ headingLevel = 3 }: { headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <section className="space-y-2">
      <H className="text-sm font-bold">写真の出典</H>
      {PHOTO_CREDITS.length === 0 ? (
        <p className="text-sm text-muted">写真はまだありません</p>
      ) : (
        <>
          <PhotoListNote />
          {/* PC（sm 以上） */}
          <div className="hidden sm:block overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-xs">
              <thead className="bg-panel-2 text-left text-muted">
                <tr>
                  <th scope="col" className="px-2 py-1.5 font-normal">
                    <span className="sr-only">見本</span>
                  </th>
                  <th scope="col" className="px-2 py-1.5 font-normal">対象</th>
                  <th scope="col" className="px-2 py-1.5 font-normal">題名</th>
                  <th scope="col" className="px-2 py-1.5 font-normal">撮影者</th>
                  <th scope="col" className="px-2 py-1.5 font-normal">ライセンス</th>
                  <th scope="col" className="px-2 py-1.5 font-normal">入手元</th>
                  <th scope="col" className="px-2 py-1.5 font-normal">変更内容</th>
                </tr>
              </thead>
              <tbody>
                {PHOTO_CREDITS.map((c) => (
                  <tr key={c.id} className="border-t border-line align-top">
                    <td className="px-2 py-1.5">
                      <Thumb c={c} />
                    </td>
                    <th scope="row" className="px-2 py-1.5 text-left font-bold">
                      {photoTargetLabel(c.target)}
                    </th>
                    <td className="px-2 py-1.5 break-words">{c.title}</td>
                    <td className="px-2 py-1.5">
                      <Author c={c} />
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <Ext href={c.licenseUrl}>{c.license}</Ext>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <Ext href={c.sourceUrl}>{sourceName(c.sourceUrl)}</Ext>
                    </td>
                    <td className="px-2 py-1.5 text-muted">{c.changes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* スマホ（sm 未満） */}
          <ul className="sm:hidden space-y-2">
            {PHOTO_CREDITS.map((c) => (
              <li key={c.id} className="flex gap-3 rounded-lg border border-line bg-panel-2/60 p-2 text-xs">
                <Thumb c={c} />
                <dl className="flex-1 min-w-0 space-y-0.5 break-words">
                  <dt className="sr-only">対象</dt>
                  <dd className="font-bold">{photoTargetLabel(c.target)}</dd>
                  <dt className="sr-only">題名</dt>
                  <dd>{c.title}</dd>
                  <div className="flex flex-wrap gap-x-1">
                    <dt className="text-muted">撮影者</dt>
                    <dd>
                      <Author c={c} />
                    </dd>
                  </div>
                  <div className="flex flex-wrap gap-x-1">
                    <dt className="text-muted">ライセンス</dt>
                    <dd>
                      <Ext href={c.licenseUrl}>{c.license}</Ext>
                    </dd>
                  </div>
                  <div className="flex flex-wrap gap-x-1">
                    <dt className="text-muted">入手元</dt>
                    <dd>
                      <Ext href={c.sourceUrl}>{sourceName(c.sourceUrl)}</Ext>
                    </dd>
                  </div>
                  <div className="flex flex-wrap gap-x-1">
                    <dt className="text-muted">変更内容</dt>
                    <dd className="text-muted">{c.changes}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
