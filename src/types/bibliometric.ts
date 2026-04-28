export const JOURNALS = [
  "Journal of the American College of Cardiology",
  "Circulation",
  "European Heart Journal",
  "JAMA Cardiology"
] as const;

export const JOURNAL_CODES = {
  "Journal of the American College of Cardiology": "JACC",
  Circulation: "CIRC",
  "European Heart Journal": "EHJ",
  "JAMA Cardiology": "JAMA"
} as const;

export const ARTICLE_TYPES = [
  "Original Research Article",
  "Review",
  "Editorial",
  "Guideline",
  "Consensus Statement",
  "Meta-analysis",
  "Statistics"
] as const;

export const ARTICLE_CATEGORIES = [
  "Original Research",
  "Review",
  "Meta-analysis",
  "Guideline / Statement / Statistics",
  "Editorial",
  "Other Non-original"
] as const;

export const CLASSIFICATIONS = ["ORA", "NORA"] as const;
export const DATASET_SOURCES = ["Scopus", "iCite", "WoS"] as const;
export const CITATION_DATASETS = ["Scopus", "iCite"] as const;
export const DATASET_SNAPSHOTS = [
  "2024-12-31",
  "2025-06-30",
  "2025-11-31"
] as const;

export type Journal = (typeof JOURNALS)[number];
export type JournalCode = (typeof JOURNAL_CODES)[Journal];
export type ArticleType = (typeof ARTICLE_TYPES)[number];
export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];
export type ArticleClassification = (typeof CLASSIFICATIONS)[number];
export type DatasetSource = (typeof DATASET_SOURCES)[number];
export type CitationDataset = (typeof CITATION_DATASETS)[number];
export type DatasetSnapshot = (typeof DATASET_SNAPSHOTS)[number];

export interface CitationPoint {
  year: number;
  citations: number;
}

export interface Author {
  name: string;
  affiliation: string;
}

export interface TaxonomyHeader {
  level1: string;
  level2: string;
  level3: string;
  display: string;
}

export interface DatasetIndexingStatus {
  indexed: boolean;
  snapshot: DatasetSnapshot;
  indexedSnapshots: DatasetSnapshot[];
  originalCategory: string;
  totalCitationCount: number | null;
  twoYearCitationCount: number | null;
  fitness: number | null;
}

export interface ArticleReference {
  id?: string;
  title: string;
  authors: string[];
  journal: string;
  publicationYear: number;
  doi: string;
}

export interface CitingArticle {
  id: string;
  title: string;
  journal: Journal;
  publicationDate: string;
  authors: string[];
  articleCategory: ArticleCategory;
  datasetIndexing: Record<DatasetSource, DatasetIndexingStatus>;
  dataset: CitationDataset;
  snapshot: DatasetSnapshot;
}

export interface Article {
  id: string;
  title: string;
  abstract: string;
  doi: string;
  journal: Journal;
  authors: Author[];
  affiliations: string[];
  keywords: string[];
  publicationDate: string;
  publicationYear: number;
  volume: string;
  issue: string;
  pageSpan: string;
  articleType: ArticleType;
  articleCategory: ArticleCategory;
  classification: ArticleClassification;
  taxonomy: TaxonomyHeader;
  datasetIndexing: Record<DatasetSource, DatasetIndexingStatus>;
  citationTrajectories: Record<CitationDataset, CitationPoint[]>;
  totalCitationCount: number;
  twoYearCitationCount: number;
  fitness: number;
  twoYearCitationQuantile: number;
  fitnessQuantile: number;
  referenceArticleIds: string[];
  referenceArticles: ArticleReference[];
  citationNetworkTargetIds: string[];
}

export type ArticleSort =
  | "publicationYearDesc"
  | "totalCitationsDesc"
  | "twoYearCitationsDesc"
  | "fitnessDesc"
  | "titleAsc";

export interface ArticleSearchFilters {
  query?: string;
  journal?: Journal[];
  yearFrom?: number;
  yearTo?: number;
  articleType?: ArticleType[];
  articleCategory?: ArticleCategory[];
  classification?: ArticleClassification[];
  dataset?: CitationDataset;
  snapshot?: DatasetSnapshot[];
  indexedIn?: DatasetSource[];
  sort?: ArticleSort;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SummaryMetrics {
  totalArticles: number;
  totalCitations: number;
  meanTwoYearCitationCount: number;
  journalCount: number;
  categoryCount: number;
}

export interface CountDatum {
  label: string;
  value: number;
}

export interface TopArticleDatum {
  id: string;
  title: string;
  journal: Journal;
  publicationYear: number;
  articleType: ArticleType;
  articleCategory: ArticleCategory;
  classification: ArticleClassification;
  taxonomyDisplay: string;
  totalCitationCount: number;
  twoYearCitationCount: number;
  fitness: number;
  datasetIndexing: Record<DatasetSource, DatasetIndexingStatus>;
}

export interface HistogramBin {
  label: string;
  min: number;
  max: number;
  count: number;
}

export interface ArticleGroupBenchmark {
  label: string;
  meanTemporal: CitationPoint[];
  meanCumulative: CitationPoint[];
}

export interface ArticleSourceBenchmark extends ArticleGroupBenchmark {
  twoYearCitationHistogram: HistogramBin[];
  fitnessHistogram: HistogramBin[];
  twoYearCitationValue: number | null;
  fitnessValue: number | null;
  twoYearCitationQuantile: number | null;
  fitnessQuantile: number | null;
}

export interface ArticleDetailResult {
  article: Article;
  similarArticles: TopArticleDatum[];
  citingArticles: CitingArticle[];
  referenceArticles: ArticleReference[];
  coCitedArticles: TopArticleDatum[];
  benchmark: Record<CitationDataset, ArticleSourceBenchmark>;
}

export interface CitationNetworkNode {
  id: string;
  title: string;
  journal: string;
  publicationYear: number;
  articleCategory: ArticleCategory | "External Citation";
  classification: ArticleClassification | "External";
  totalCitationCount: number;
  twoYearCitationCount: number;
  fitness: number;
  sourceType: "target-journal" | "external-citing";
  targetArticleId?: string;
}

export interface CitationNetworkEdge {
  source: string;
  target: string;
  value: number;
}

export interface CitationNetworkData {
  nodes: CitationNetworkNode[];
  edges: CitationNetworkEdge[];
}

export interface HomeDashboardData {
  metrics: SummaryMetrics;
  articleVolumeByJournal: CountDatum[];
  articleVolumeByYear: CountDatum[];
  categoryDistribution: CountDatum[];
  topArticles: TopArticleDatum[];
  citationNetwork: CitationNetworkData;
}
