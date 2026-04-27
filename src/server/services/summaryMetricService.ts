import type { BibliometricRepository } from "@/server/repositories";
import type {
  Article,
  CountDatum,
  HomeDashboardData,
  SummaryMetrics,
  TopArticleDatum
} from "@/types/bibliometric";

function groupCount<T extends string>(items: readonly T[]) {
  return items.reduce<Record<T, number>>(
    (counts, item) => ({
      ...counts,
      [item]: (counts[item] ?? 0) + 1
    }),
    {} as Record<T, number>
  );
}

function toCountData(counts: Record<string, number>, preferredOrder?: readonly string[]): CountDatum[] {
  const labels = preferredOrder ?? Object.keys(counts);
  return labels
    .filter((label) => counts[label] !== undefined)
    .map((label) => ({
      label,
      value: counts[label]
    }));
}

function toTopArticleDatum(article: Article): TopArticleDatum {
  return {
    id: article.id,
    title: article.title,
    journal: article.journal,
    publicationYear: article.publicationYear,
    articleType: article.articleType,
    articleCategory: article.articleCategory,
    classification: article.classification,
    taxonomyDisplay: article.taxonomy.display,
    totalCitationCount: article.totalCitationCount,
    twoYearCitationCount: article.twoYearCitationCount,
    fitness: article.fitness,
    datasetIndexing: article.datasetIndexing
  };
}

export async function getSummaryMetrics(
  repository: BibliometricRepository
): Promise<SummaryMetrics> {
  const [articles, journals, articleCategories] = await Promise.all([
    repository.getArticles(),
    repository.getJournals(),
    repository.getArticleCategories()
  ]);
  const totalCitations = articles.reduce(
    (sum, article) => sum + article.totalCitationCount,
    0
  );
  const totalTwoYearCitations = articles.reduce(
    (sum, article) => sum + article.twoYearCitationCount,
    0
  );

  return {
    totalArticles: articles.length,
    totalCitations,
    meanTwoYearCitationCount:
      articles.length > 0 ? totalTwoYearCitations / articles.length : 0,
    journalCount: journals.length,
    categoryCount: articleCategories.length
  };
}

export async function getHomeDashboardData(
  repository: BibliometricRepository
): Promise<HomeDashboardData> {
  const [articles, journals, articleCategories] = await Promise.all([
    repository.getArticles(),
    repository.getJournals(),
    repository.getArticleCategories()
  ]);
  const metrics = await getSummaryMetrics(repository);
  const byJournal = groupCount(articles.map((article) => article.journal));
  const byCategory = groupCount(articles.map((article) => article.articleCategory));
  const byYear = groupCount(
    articles.map((article) => String(article.publicationYear))
  );
  const orderedYears = Array.from({ length: 15 }, (_, index) => String(2008 + index));

  return {
    metrics,
    articleVolumeByJournal: toCountData(byJournal, journals),
    articleVolumeByYear: toCountData(byYear, orderedYears),
    categoryDistribution: toCountData(byCategory, articleCategories),
    topArticles: [...articles]
      .sort((a, b) => b.totalCitationCount - a.totalCitationCount)
      .slice(0, 10)
      .map(toTopArticleDatum),
    citationNetwork: {
      nodes: [...articles]
        .sort((a, b) => b.twoYearCitationCount - a.twoYearCitationCount)
        .slice(0, 950)
        .map((article) => ({
          id: article.id,
          title: article.title,
          journal: article.journal,
          publicationYear: article.publicationYear,
          articleCategory: article.articleCategory,
          classification: article.classification,
          totalCitationCount: article.totalCitationCount,
          twoYearCitationCount: article.twoYearCitationCount,
          fitness: article.fitness
        })),
      edges: articles
        .flatMap((article) =>
          article.citationNetworkTargetIds.map((target) => ({
            source: article.id,
            target,
            value: 1
          }))
        )
        .slice(0, 1800)
    }
  };
}
