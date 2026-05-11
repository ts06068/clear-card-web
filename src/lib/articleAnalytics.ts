import type {
  Article,
  ArticleOrderKey,
  ArticleSortCriterion,
  CitationDataset,
  Journal
} from "@/types/bibliometric";

export function isCitableItem(article: Article) {
  return article.articleCategory !== "Editorial" && article.articleCategory !== "Other Non-original";
}

export function citationCountInYear(
  article: Article,
  dataset: CitationDataset,
  year: number
) {
  return (
    article.citationTrajectories[dataset].find((point) => point.year === year)?.citations ?? 0
  );
}

export function jifCitableItems(articles: Article[], journal: Journal, jifYear: number) {
  return articles.filter(
    (article) =>
      article.journal === journal &&
      isCitableItem(article) &&
      (article.publicationYear === jifYear - 1 || article.publicationYear === jifYear - 2)
  );
}

export function jifNumerator(
  articles: Article[],
  journal: Journal,
  jifYear: number,
  dataset: CitationDataset
) {
  return jifCitableItems(articles, journal, jifYear).reduce(
    (sum, article) => sum + citationCountInYear(article, dataset, jifYear),
    0
  );
}

export function jifValue(
  articles: Article[],
  journal: Journal,
  jifYear: number,
  dataset: CitationDataset
) {
  const denominator = jifCitableItems(articles, journal, jifYear).length;

  if (denominator === 0) {
    return 0;
  }

  return jifNumerator(articles, journal, jifYear, dataset) / denominator;
}

export function jifContributionPercent(
  article: Article,
  articles: Article[],
  dataset: CitationDataset,
  offset: 1 | 2
) {
  if (!isCitableItem(article)) {
    return 0;
  }

  const jifYear = article.publicationYear + offset;
  const numerator = jifNumerator(articles, article.journal, jifYear, dataset);

  if (numerator === 0) {
    return 0;
  }

  return (citationCountInYear(article, dataset, jifYear) / numerator) * 100;
}

export function citationTrajectoryMomentum(article: Article, dataset: CitationDataset) {
  const trajectory = article.citationTrajectories[dataset];
  const lastThreeYears = trajectory.slice(-3);

  return lastThreeYears.reduce((sum, point) => sum + point.citations, 0);
}

function taxonomyDisplay(article: Article) {
  return article.taxonomy.display;
}

function valueForOrderKey(
  article: Article,
  key: ArticleOrderKey,
  dataset: CitationDataset,
  allArticles: Article[]
) {
  if (key === "title") {
    return article.title;
  }

  if (key === "journal") {
    return article.journal;
  }

  if (key === "publicationYear") {
    return article.publicationYear;
  }

  if (key === "articleCategory") {
    return article.articleCategory;
  }

  if (key === "taxonomy") {
    return taxonomyDisplay(article);
  }

  if (key === "totalCitations") {
    return article.datasetIndexing[dataset].totalCitationCount ?? 0;
  }

  if (key === "twoYearCitations") {
    return article.datasetIndexing[dataset].twoYearCitationCount ?? 0;
  }

  if (key === "fitness") {
    return article.datasetIndexing[dataset].fitness ?? 0;
  }

  if (key === "jifYearOneContribution") {
    return jifContributionPercent(article, allArticles, dataset, 1);
  }

  if (key === "jifYearTwoContribution") {
    return jifContributionPercent(article, allArticles, dataset, 2);
  }

  return citationTrajectoryMomentum(article, dataset);
}

function compareValues(a: string | number, b: string | number) {
  if (typeof a === "string" && typeof b === "string") {
    return a.localeCompare(b);
  }

  return Number(a) - Number(b);
}

export function compareArticlesByCriteria(
  a: Article,
  b: Article,
  criteria: ArticleSortCriterion[],
  dataset: CitationDataset,
  allArticles: Article[]
) {
  for (const criterion of criteria) {
    const compared = compareValues(
      valueForOrderKey(a, criterion.key, dataset, allArticles),
      valueForOrderKey(b, criterion.key, dataset, allArticles)
    );

    if (compared !== 0) {
      return criterion.direction === "asc" ? compared : -compared;
    }
  }

  return 0;
}
