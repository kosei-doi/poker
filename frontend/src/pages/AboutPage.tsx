import { ConceptSection } from '../components/about/ConceptSection';
import { CorrectionChart } from '../components/about/CorrectionChart';
import { DataSources } from '../components/about/DataSources';
import { FormulaSection } from '../components/about/FormulaSection';
import { LabelTable } from '../components/about/LabelTable';

/** 穴場度とは（N4-2） */
export function AboutPage() {
  return (
    <main className="flex-1 min-h-0 overflow-y-auto">
      <div className="mx-auto max-w-[760px] px-4 py-6 space-y-10 fade-in">
        <h1 className="text-2xl font-extrabold">穴場度とは</h1>
        <ConceptSection />
        <FormulaSection />
        <CorrectionChart />
        <LabelTable />
        <DataSources />
      </div>
    </main>
  );
}
