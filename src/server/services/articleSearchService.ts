import type { BibliometricRepository } from "@/server/repositories";
import type {
  Article,
  ArticleSearchFilters,
  PaginatedResult
} from "@/types/bibliometric";
import { compareArticlesByCriteria } from "@/lib/articleAnalytics";

const DEFAULT_PAGE_SIZE = 20;

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function matchesQuery(article: Article, rawQuery?: string) {
  const query = rawQuery ? normalize(rawQuery) : "";

  if (!query) {
    return true;
  }

  const searchableText = [
    article.title,
    article.abstract,
    article.doi,
    article.journal,
    article.articleType,
    article.articleCategory,
    article.classification,
    article.taxonomy.display,
    article.volume,
    article.issue,
    article.pageSpan,
    ...article.keywords,
    ...article.authors.map((author) => author.name),
    ...article.affiliations
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(query);
}

function matchesAny<T extends string>(selected: T[] | undefined, value: T) {
  return !selected || selected.length === 0 || selected.includes(value);
}

function applyFilters(articles: Article[], filters: ArticleSearchFilters) {
  return articles.filter((article) => {
    if (filters.ids && filters.ids.length > 0 && !filters.ids.includes(article.id)) {
      return false;
    }

    if (!matchesQuery(article, filters.query)) {
      return false;
    }

    if (!matchesAny(filters.journal, article.journal)) {
      return false;
    }

    if (filters.yearFrom && article.publicationYear < filters.yearFrom) {
      return false;
    }

    if (filters.yearTo && article.publicationYear > filters.yearTo) {
      return false;
    }

    if (!matchesAny(filters.articleType, article.articleType)) {
      return false;
    }

    if (!matchesAny(filters.articleCategory, article.articleCategory)) {
      return false;
    }

    if (!matchesAny(filters.classification, article.classification)) {
      return false;
    }

    if (
      filters.indexedIn &&
      filters.indexedIn.length > 0 &&
      !filters.indexedIn.some((source) => article.datasetIndexing[source].indexed)
    ) {
      return false;
    }

    if (
      filters.snapshot &&
      filters.snapshot.length > 0 &&
      filters.dataset &&
      !filters.snapshot.some((snapshot) =>
        article.datasetIndexing[filters.dataset ?? "Scopus"].indexedSnapshots.includes(snapshot)
      )
    ) {
      return false;
    }

    return true;
  });
}

function sortArticles(
  articles: Article[],
  sort: ArticleSearchFilters["sort"] = "publicationYearDesc",
  dataset: ArticleSearchFilters["dataset"] = "Scopus",
  order: ArticleSearchFilters["order"] = [],
  allArticles: Article[] = articles
) {
  const sorted = [...articles];

  if (order.length > 0) {
    return sorted.sort((a, b) => {
      const compared = compareArticlesByCriteria(a, b, order, dataset, allArticles);

      if (compared !== 0) {
        return compared;
      }

      return b.publicationYear - a.publicationYear;
    });
  }

  if (sort === "totalCitationsDesc") {
    return sorted.sort(
      (a, b) =>
        (b.datasetIndexing[dataset].totalCitationCount ?? 0) -
        (a.datasetIndexing[dataset].totalCitationCount ?? 0)
    );
  }

  if (sort === "twoYearCitationsDesc") {
    return sorted.sort(
      (a, b) =>
        (b.datasetIndexing[dataset].twoYearCitationCount ?? 0) -
        (a.datasetIndexing[dataset].twoYearCitationCount ?? 0)
    );
  }

  if (sort === "fitnessDesc") {
    return sorted.sort(
      (a, b) =>
        (b.datasetIndexing[dataset].fitness ?? b.fitness) -
        (a.datasetIndexing[dataset].fitness ?? a.fitness)
    );
  }

  if (sort === "titleAsc") {
    return sorted.sort((a, b) => a.title.localeCompare(b.title));
  }

  return sorted.sort((a, b) => {
    if (b.publicationYear !== a.publicationYear) {
      return b.publicationYear - a.publicationYear;
    }

    return (b.datasetIndexing[dataset].totalCitationCount ?? 0) - (a.datasetIndexing[dataset].totalCitationCount ?? 0);
  });
}

export async function searchArticles(
  repository: BibliometricRepository,
  filters: ArticleSearchFilters
): Promise<PaginatedResult<Article>> {
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const page = Math.max(filters.page ?? 1, 1);
  const articles = await repository.getArticles();
  const filtered = applyFilters(articles, filters);
  const sorted = sortArticles(filtered, filters.sort, filters.dataset, filters.order, articles);
  const totalPages = Math.max(Math.ceil(sorted.length / pageSize), 1);
  const boundedPage = Math.min(page, totalPages);
  const start = (boundedPage - 1) * pageSize;

  return {
    items: sorted.slice(start, start + pageSize),
    totalItems: sorted.length,
    page: boundedPage,
    pageSize,
    totalPages
  };
}
