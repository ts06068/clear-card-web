import type {
  Article,
  ArticleCategory,
  ArticleType,
  Journal
} from "@/types/bibliometric";

export interface BibliometricRepository {
  getArticles(): Promise<Article[]>;
  getArticleById(id: string): Promise<Article | null>;
  getJournals(): Promise<Journal[]>;
  getArticleCategories(): Promise<ArticleCategory[]>;
  getArticleTypes(): Promise<ArticleType[]>;
}
