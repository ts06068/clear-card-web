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
  ArticleSort,
  DatasetSnapshot,
  DatasetSource,
  Journal,
  ArticleType,
  ArticleCategory
} from "@/types/bibliometric";

type RawSearchParams = Record<string, string | string[] | undefined>;
export type PlainSearchParams = Record<string, string | string[]>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function values(value: string | string[] | undefined) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
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

function manyOf<T extends readonly string[]>(
  value: string | string[] | undefined,
  options: T
): T[number][] | undefined {
  const selected = values(value)
    .filter((raw) => raw.trim())
    .filter((raw): raw is T[number] => options.includes(raw as T[number]));

  return selected.length > 0 ? selected : undefined;
}

export function parseArticleSearchParams(
  params: RawSearchParams = {}
): ArticleSearchFilters {
  const yearFrom = numberValue(params.yearFrom);
  const yearTo = numberValue(params.yearTo);

  return {
    query: stringValue(params.q),
    journal: manyOf(params.journal, JOURNALS) as Journal[] | undefined,
    yearFrom,
    yearTo,
    articleType: manyOf(params.articleType, ARTICLE_TYPES) as ArticleType[] | undefined,
    articleCategory: manyOf(params.articleCategory, ARTICLE_CATEGORIES) as
      | ArticleCategory[]
      | undefined,
    classification: manyOf(params.classification, CLASSIFICATIONS) as
      | ArticleClassification[]
      | undefined,
    dataset: oneOf(params.dataset, CITATION_DATASETS),
    snapshot: manyOf(params.snapshot, DATASET_SNAPSHOTS) as DatasetSnapshot[] | undefined,
    indexedIn: manyOf(params.indexedIn, DATASET_SOURCES) as DatasetSource[] | undefined,
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
  const plain: PlainSearchParams = {};

  for (const [key, value] of Object.entries(params)) {
    const validValues = values(value).filter((item) => item.trim());

    if (validValues.length === 1) {
      plain[key] = validValues[0];
    } else if (validValues.length > 1) {
      plain[key] = validValues;
    }
  }

  return plain;
}
