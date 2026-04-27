import { ResultsAtlas } from "@/components/charts/ResultsAtlas";
import { PageHeader } from "@/components/PageHeader";
import { getResearchResults } from "@/server/services";

export default async function ResultsPage() {
  const dataset = await getResearchResults();

  return (
    <>
      <PageHeader
        title="Results Atlas"
        subtitle="Interactive chart access to the main figure concepts and all extracted supplemental result tables from the CLEAR-CARD manuscript files."
        eyebrow="CLEAR-CARD manuscript outputs"
      />
      <ResultsAtlas dataset={dataset} />
    </>
  );
}
