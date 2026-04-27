import type { BibliometricRepository } from "@/server/repositories";
import type {
  Article,
  ArticleSearchFilters,
  PaginatedResult
} from "@/types/bibliometric";

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

function applyFilters(articles: Article[], filters: ArticleSearchFilters) {
  return articles.filter((article) => {
    if (!matchesQuery(article, filters.query)) {
      return false;
    }

    if (filters.journal && article.journal !== filters.journal) {
      return false;
    }

    if (filters.yearFrom && article.publicationYear < filters.yearFrom) {
      return false;
    }

    if (filters.yearTo && article.publicationYear > filters.yearTo) {
      return false;
    }

    if (filters.articleType && article.articleType !== filters.articleType) {
      return false;
    }

    if (filters.articleCategory && article.articleCategory !== filters.articleCategory) {
      return false;
    }

    if (filters.classification && article.classification !== filters.classification) {
      return false;
    }

    if (
      filters.indexedIn &&
      !article.datasetIndexing[filters.indexedIn].indexed
    ) {
      return false;
    }

    if (
      filters.snapshot &&
      filters.dataset &&
      !article.datasetIndexing[filters.dataset].indexedSnapshots.includes(filters.snapshot)
    ) {
      return false;
    }

    return true;
  });
}

function sortArticles(
  articles: Article[],
  sort: ArticleSearchFilters["sort"] = "publicationYearDesc",
  dataset: ArticleSearchFilters["dataset"] = "Scopus"
) {
  const sorted = [...articles];

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
  const sorted = sortArticles(filtered, filters.sort, filters.dataset);
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
