import { Sparkles } from 'lucide-react';

/** 2章のコンセプト（N4-2） */
export function ConceptSection() {
  return (
    <section aria-labelledby="about-concept" className="space-y-4">
      <h2 id="about-concept" className="flex items-center gap-2 text-lg font-bold">
        <Sparkles size={18} className="text-glow" aria-hidden />
        コンセプト
      </h2>
      <ul className="space-y-2 text-sm leading-relaxed">
        <li>有名な観光地ではなく、知名度は低いけれど行った人の満足度が高い場所を「穴場」として紹介します。</li>
        <li>穴場かどうかは編集部が選ぶのではなく、訪れた人の声（感想）から AI が点数を付けて計算します。</li>
        <li>声が増えるたびに点数も変わります。あなたの感想も計算に入ります。</li>
      </ul>
      <p className="rounded-2xl border border-glow/40 bg-glow/10 px-4 py-5 text-center text-xl sm:text-2xl font-extrabold tracking-wide">
        <span className="text-glow">穴場度</span>
        <span className="mx-2 text-muted">=</span>
        満足度
        <span className="mx-2 text-muted">−</span>
        知名度
      </p>
    </section>
  );
}
