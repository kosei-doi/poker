import { Loader2, Megaphone, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ai } from '../../ai';
import { townById } from '../../data/towns';
import { voicesOfTown } from '../../lib/candidate';
import { isAbortError, sleep } from '../../lib/sleep';
import { useApp } from '../../state/context';
import { useSnapshot } from '../../state/selectors';
import type { TownId, TownReport } from '../../types';
import { TagChip } from '../common/TagChip';

export const REPORT_WAIT_MS = 1500;

/** 町向けレポート（D3-1）。町が変わるたびに前の待ちを止め、1.5秒待って作る（6章の待ち時間） */
export function ReportView({ townId }: { townId: TownId }) {
  const { tasks } = useApp();
  const snap = useSnapshot();
  const [report, setReport] = useState<TownReport | null>(null);

  useEffect(() => {
    const town = townById(townId);
    if (!town) return;
    setReport(null);
    const signal = tasks.start('report');
    Promise.all([ai.buildReport(town, voicesOfTown(townId, snap)), sleep(REPORT_WAIT_MS, signal)])
      .then(([r]) => {
        if (!signal.aborted) setReport(r);
      })
      .catch((e) => {
        if (!isAbortError(e)) throw e;
      });
    return () => tasks.abort('report');
    // 開いた時点（町を選んだ時点）の声で作る
  }, [townId, tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  const town = townById(townId)!;
  return (
    <div aria-live="polite">
      {!report ? (
        <div className="flex flex-col items-center gap-3 py-10 text-muted" role="status">
          <Loader2 className="animate-spin text-glow" size={28} aria-hidden />
          AI が声をまとめています…
        </div>
      ) : (
        <div className="space-y-5 fade-in">
          <p className="text-sm text-muted">訪れた人の声から、{town.name}の「知られていない強み」をまとめました。</p>
          <section className="space-y-2">
            <h3 className="flex items-center gap-1.5 text-sm font-bold">
              <ThumbsUp size={15} className="text-glow" aria-hidden />① 行く前は知らなかったのに満足した人が挙げた良い点
            </h3>
            {report.goodPoints.length > 0 ? (
              <ol className="space-y-1.5">
                {report.goodPoints.map((g, i) => (
                  <li key={g.tag} className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-glow w-4">{i + 1}</span>
                    <TagChip tag={g.tag} />
                    <span className="text-muted">{g.count}件</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted">まだ該当する声がありません</p>
            )}
          </section>
          <section className="space-y-2">
            <h3 className="flex items-center gap-1.5 text-sm font-bold">
              <ThumbsDown size={15} className="text-muted" aria-hidden />② 不満として挙がった点
            </h3>
            {report.complaints.length > 0 ? (
              <ul className="space-y-1">
                {report.complaints.map((c) => (
                  <li key={c.word} className="text-sm">
                    「{c.word}」<span className="text-muted ml-1">{c.count}件</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm">目立った不満はなし</p>
            )}
          </section>
          <section className="space-y-2">
            <h3 className="flex items-center gap-1.5 text-sm font-bold">
              <Megaphone size={15} className="text-glow" aria-hidden />③ 発信文の案
            </h3>
            {report.pitch ? (
              <p className="rounded-lg border border-glow/50 bg-glow/10 px-3 py-2 text-sm">{report.pitch}</p>
            ) : (
              <p className="text-sm text-muted">良い点の声が集まると作れます</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
