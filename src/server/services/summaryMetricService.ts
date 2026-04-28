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

const externalJournals = [
  "New England Journal of Medicine",
  "The Lancet",
  "JAMA",
  "Nature Medicine",
  "BMJ",
  "Annals of Internal Medicine",
  "European Journal of Preventive Cardiology",
  "Heart"
] as const;

function makeExternalCitationNodes(articles: Article[]) {
  return articles.slice(0, 360).flatMap((article, index) => {
    const externalCount = 1 + (index % 3);

    return Array.from({ length: externalCount }, (_, offset) => {
      const publicationYear = Math.min(
        2022,
        article.publicationYear + 1 + ((index + offset) % 5)
      );
      const twoYearCitationCount = Math.max(
        1,
        Math.round(article.twoYearCitationCount * (0.08 + ((index + offset) % 7) * 0.025))
      );

      return {
        node: {
          id: `external-citing-${article.id}-${offset}`,
          title: `External citation record connected to ${article.title}`,
          journal: externalJournals[(index + offset) % externalJournals.length],
          publicationYear,
          articleCategory: "External Citation" as const,
          classification: "External" as const,
          totalCitationCount: Math.max(twoYearCitationCount, Math.round(article.totalCitationCount * 0.05)),
          twoYearCitationCount,
          fitness: Math.max(0.1, Number((article.fitness * 0.55).toFixed(2))),
          sourceType: "external-citing" as const,
          targetArticleId: article.id
        },
        edge: {
          source: `external-citing-${article.id}-${offset}`,
          target: article.id,
          value: 1
        }
      };
    });
  });
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
  const networkArticles = [...articles]
    .sort((a, b) => b.twoYearCitationCount - a.twoYearCitationCount)
    .slice(0, 950);
  const externalNetwork = makeExternalCitationNodes(networkArticles);

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
      nodes: [
        ...networkArticles.map((article) => ({
          id: article.id,
          title: article.title,
          journal: article.journal,
          publicationYear: article.publicationYear,
          articleCategory: article.articleCategory,
          classification: article.classification,
          totalCitationCount: article.totalCitationCount,
          twoYearCitationCount: article.twoYearCitationCount,
          fitness: article.fitness,
          sourceType: "target-journal" as const
        })),
        ...externalNetwork.map((item) => item.node)
      ],
      edges: [
        ...networkArticles.flatMap((article) =>
          article.citationNetworkTargetIds.map((target) => ({
            source: article.id,
            target,
            value: 1
          }))
        ),
        ...externalNetwork.map((item) => item.edge)
      ].slice(0, 2400)
    }
  };
}
