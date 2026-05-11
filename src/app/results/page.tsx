import { PageHeader } from "@/components/PageHeader";
import { ReportsWorkspace } from "@/components/reports/ReportsWorkspace";
import { bibliometricRepository } from "@/server/repositories";
import { getResearchResults } from "@/server/services";

export default async function ResultsPage() {
  const [dataset, articles] = await Promise.all([
    getResearchResults(),
    bibliometricRepository.getArticles()
  ]);

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Create article-level and journal-year views for cardiovascular citation literature analysis, then open the matching articles directly from plots."
        eyebrow="Citation analytics"
      />
      <ReportsWorkspace dataset={dataset} articles={articles} />
    </>
  );
}
