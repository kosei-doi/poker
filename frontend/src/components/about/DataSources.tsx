import { Database } from 'lucide-react';
import type { ReactNode } from 'react';

/** 境界データの出典（後で data/attributions.ts の定数に差し替える） */
const BOUNDARY_ATTRIBUTION = '出典：「国土数値情報（行政区域データ）」（国土交通省）を加工して作成';

/** データについて（N4-2・N5-5）。写真の出典一覧は photoCredits で受け取る */
export function DataSources({ photoCredits }: { photoCredits?: ReactNode }) {
  return (
    <section aria-labelledby="about-data" className="space-y-4">
      <h2 id="about-data" className="flex items-center gap-2 text-lg font-bold">
        <Database size={18} className="text-glow" aria-hidden />
        データについて
      </h2>
      <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
        <li>感想（声）はサンプルとして用意した架空のものです。実在の人の感想ではありません。</li>
        <li>費用・所要時間・移動時間は目安のサンプル値です。実際とは異なることがあります。</li>
        <li>知名度は「来た人が知っていたか」で測っているため、来ていない人の認知は反映されません。</li>
      </ul>
      <div className="space-y-1">
        <h3 className="text-sm font-bold">地図の境界データ（市町村・都道府県）</h3>
        <p className="text-sm text-muted">{BOUNDARY_ATTRIBUTION}</p>
      </div>
      {photoCredits && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold">写真の出典</h3>
          {photoCredits}
        </div>
      )}
    </section>
  );
}
