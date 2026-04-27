import { BibliometricRepository } from "@/server/repositories";
import {
  Article,
  ArticleDetailResult,
  ArticleSourceBenchmark,
  CITATION_DATASETS,
  CitationDataset,
  CitationPoint,
  HistogramBin,
  TopArticleDatum
} from "@/types/bibliometric";

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

function sharedKeywordScore(source: Article, candidate: Article) {
  const sourceKeywords = new Set(source.keywords.map((keyword) => keyword.toLowerCase()));
  return candidate.keywords.reduce(
    (score, keyword) => score + (sourceKeywords.has(keyword.toLowerCase()) ? 1 : 0),
    0
  );
}

function cumulative(points: CitationPoint[]): CitationPoint[] {
  let running = 0;

  return points.map((point) => {
    running += point.citations;
    return {
      year: point.year,
      citations: running
    };
  });
}

function meanTrajectory(
  articles: Article[],
  publicationYear: number,
  dataset: CitationDataset
): CitationPoint[] {
  const years = Array.from({ length: 2025 - publicationYear + 1 }, (_, index) => publicationYear + index);

  return years.map((year) => {
    const values = articles.map(
      (article) =>
        article.citationTrajectories[dataset].find((point) => point.year === year)?.citations ?? 0
    );

    return {
      year,
      citations:
        values.length > 0
          ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1))
          : 0
    };
  });
}

function percentileRank(values: number[], value: number | null) {
  if (value === null || values.length === 0) {
    return null;
  }

  if (values.length === 1) {
    return 1;
  }

  const lessOrEqual = values.filter((candidate) => candidate <= value).length;
  return Number((lessOrEqual / values.length).toFixed(3));
}

function getSourceValue(
  article: Article,
  dataset: CitationDataset,
  metric: "twoYearCitationCount" | "fitness"
) {
  return article.datasetIndexing[dataset].indexed
    ? article.datasetIndexing[dataset][metric]
    : null;
}

function makeSourceBenchmark(
  article: Article,
  group: Article[],
  dataset: CitationDataset
): ArticleSourceBenchmark {
  const indexedGroup = group.filter((candidate) => candidate.datasetIndexing[dataset].indexed);
  const sourceGroup = indexedGroup.length > 0 ? indexedGroup : group;
  const twoYearValues = sourceGroup
    .map((candidate) => candidate.datasetIndexing[dataset].twoYearCitationCount)
    .filter((value): value is number => value !== null);
  const fitnessValues = sourceGroup
    .map((candidate) => candidate.datasetIndexing[dataset].fitness)
    .filter((value): value is number => value !== null);
  const twoYearCitationValue = getSourceValue(article, dataset, "twoYearCitationCount");
  const fitnessValue = getSourceValue(article, dataset, "fitness");
  const meanTemporal = meanTrajectory(sourceGroup, article.publicationYear, dataset);

  return {
    label: `${dataset}: ${article.journal}, ${article.publicationYear}, ${article.articleCategory}`,
    meanTemporal,
    meanCumulative: cumulative(meanTemporal),
    twoYearCitationHistogram: makeHistogram(twoYearValues),
    fitnessHistogram: makeHistogram(fitnessValues),
    twoYearCitationValue,
    fitnessValue,
    twoYearCitationQuantile: percentileRank(twoYearValues, twoYearCitationValue),
    fitnessQuantile: percentileRank(fitnessValues, fitnessValue)
  };
}

function makeHistogram(values: number[], bins = 10): HistogramBin[] {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const width = Math.max((max - min) / bins, 1);

  return Array.from({ length: bins }, (_, index) => {
    const start = min + index * width;
    const end = index === bins - 1 ? max : start + width;
    return {
      label: `${start.toFixed(1)}-${end.toFixed(1)}`,
      min: start,
      max: end,
      count: values.filter((value) =>
        index === bins - 1 ? value >= start && value <= end : value >= start && value < end
      ).length
    };
  });
}

export async function getArticleDetail(
  repository: BibliometricRepository,
  id: string
): Promise<ArticleDetailResult | null> {
  const article = await repository.getArticleById(id);

  if (!article) {
    return null;
  }

  const allArticles = await repository.getArticles();
  const group = allArticles.filter(
    (candidate) =>
      candidate.journal === article.journal &&
      candidate.publicationYear === article.publicationYear &&
      candidate.articleCategory === article.articleCategory
  );
  const referenceSet = new Set(article.referenceArticleIds);
  const citingArticles = allArticles
    .filter((candidate) => candidate.referenceArticleIds.includes(article.id))
    .sort((a, b) => b.publicationYear - a.publicationYear || b.totalCitationCount - a.totalCitationCount)
    .slice(0, 30)
    .map((candidate) => ({
      id: candidate.id,
      title: candidate.title,
      journal: candidate.journal,
      publicationDate: candidate.publicationDate,
      authors: candidate.authors.slice(0, 4).map((author) => author.name),
      articleCategory: candidate.articleCategory,
      datasetIndexing: candidate.datasetIndexing,
      dataset: "Scopus" as const,
      snapshot: candidate.datasetIndexing.Scopus.snapshot
    }));
  const coCitedArticles = allArticles
    .filter((candidate) => candidate.id !== article.id)
    .map((candidate) => ({
      article: candidate,
      score: candidate.referenceArticleIds.reduce(
        (score, refId) => score + (referenceSet.has(refId) ? 1 : 0),
        0
      )
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || b.article.totalCitationCount - a.article.totalCitationCount)
    .slice(0, 10)
    .map(({ article: candidate }) => toTopArticleDatum(candidate));
  const similarArticles = allArticles
    .filter((candidate) => candidate.id !== article.id)
    .map((candidate) => ({
      article: candidate,
      score:
        (candidate.articleCategory === article.articleCategory ? 4 : 0) +
        (candidate.journal === article.journal ? 2 : 0) +
        sharedKeywordScore(article, candidate) +
        Math.min(candidate.totalCitationCount / 500, 3)
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || b.article.totalCitationCount - a.article.totalCitationCount)
    .slice(0, 5)
    .map(({ article: candidate }) => toTopArticleDatum(candidate));
  const benchmark = Object.fromEntries(
    CITATION_DATASETS.map((dataset) => [
      dataset,
      makeSourceBenchmark(article, group, dataset)
    ])
  ) as Record<CitationDataset, ArticleSourceBenchmark>;

  return {
    article,
    similarArticles,
    citingArticles,
    referenceArticles: article.referenceArticles,
    coCitedArticles,
    benchmark
  };
}
