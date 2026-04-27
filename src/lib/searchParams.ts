import {
  ARTICLE_CATEGORIES,
  ARTICLE_TYPES,
  CLASSIFICATIONS,
  CITATION_DATASETS,
  DATASET_SNAPSHOTS,
  DATASET_SOURCES,
  JOURNALS
} from "@/types/bibliometric";
import type {
  ArticleClassification,
  ArticleSearchFilters,
  ArticleSort
} from "@/types/bibliometric";

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function numberValue(value: string | string[] | undefined) {
  const raw = firstValue(value);
  const parsed = raw ? Number(raw) : undefined;
  return Number.isFinite(parsed) ? parsed : undefined;
}

function stringValue(value: string | string[] | undefined) {
  const raw = firstValue(value);
  return raw && raw.trim() ? raw.trim() : undefined;
}

function oneOf<T extends readonly string[]>(
  value: string | string[] | undefined,
  options: T
): T[number] | undefined {
  const raw = firstValue(value);
  return raw && options.includes(raw as T[number]) ? (raw as T[number]) : undefined;
}

export function parseArticleSearchParams(
  params: RawSearchParams = {}
): ArticleSearchFilters {
  const yearFrom = numberValue(params.yearFrom);
  const yearTo = numberValue(params.yearTo);

  return {
    query: stringValue(params.q),
    journal: oneOf(params.journal, JOURNALS),
    yearFrom,
    yearTo,
    articleType: oneOf(params.articleType, ARTICLE_TYPES),
    articleCategory: oneOf(params.articleCategory, ARTICLE_CATEGORIES),
    classification: oneOf(params.classification, CLASSIFICATIONS) as
      | ArticleClassification
      | undefined,
    dataset: oneOf(params.dataset, CITATION_DATASETS),
    snapshot: oneOf(params.snapshot, DATASET_SNAPSHOTS),
    indexedIn: oneOf(params.indexedIn, DATASET_SOURCES),
    sort: oneOf(params.sort, [
      "publicationYearDesc",
      "totalCitationsDesc",
      "twoYearCitationsDesc",
      "fitnessDesc",
      "titleAsc"
    ] as const) as ArticleSort | undefined,
    page: numberValue(params.page),
    pageSize: 20
  };
}

export function toPlainSearchParams(params: RawSearchParams = {}) {
  const plain: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    const first = firstValue(value);

    if (first) {
      plain[key] = first;
    }
  }

  return plain;
}
