import { ResultsAtlas } from "@/components/charts/ResultsAtlas";
import { PageHeader } from "@/components/PageHeader";
import { bibliometricRepository } from "@/server/repositories";
import { getResearchResults } from "@/server/services";

export default async function ResultsPage() {
  const [dataset, articles] = await Promise.all([
    getResearchResults(),
    bibliometricRepository.getArticles()
  ]);
  const distributions = articles.map((article) => ({
    id: article.id,
    title: article.title,
    journal: article.journal,
    publicationDate: article.publicationDate,
    publicationYear: article.publicationYear,
    articleType: article.articleType,
    articleCategory: article.articleCategory,
    classification: article.classification,
    totalCitationCount: article.totalCitationCount,
    twoYearCitationCount: article.twoYearCitationCount,
    fitness: article.fitness
  }));

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Create article-level and journal-year views for cardiovascular citation literature analysis, then open the matching articles directly from plots."
        eyebrow="Citation analytics"
      />
      <ResultsAtlas dataset={dataset} articleDistributions={distributions} />
    </>
  );
}
