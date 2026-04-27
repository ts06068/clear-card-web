import {
  ARTICLE_CATEGORIES,
  ARTICLE_TYPES,
  JOURNALS
} from "@/types/bibliometric";
import type {
  Article,
  ArticleCategory,
  ArticleType,
  Journal
} from "@/types/bibliometric";
import { getDummyArticles } from "@/server/data/dummyArticles";
import type { BibliometricRepository } from "./BibliometricRepository";

export class DummyBibliometricRepository implements BibliometricRepository {
  async getArticles(): Promise<Article[]> {
    // Future MSSQL implementation: replace with SELECT projections from articles,
    // journals, taxonomy headers, authors, keywords, source indexes, and yearly_citations tables.
    return getDummyArticles();
  }

  async getArticleById(id: string): Promise<Article | null> {
    // Future MSSQL implementation: replace with a parameterized query by article id
    // plus joins for authors, affiliations, keywords, and yearly citation points.
    return getDummyArticles().find((article) => article.id === id) ?? null;
  }

  async getJournals(): Promise<Journal[]> {
    // Future MSSQL implementation: SELECT name FROM journals ORDER BY display_order.
    return [...JOURNALS];
  }

  async getArticleCategories(): Promise<ArticleCategory[]> {
    // Future MSSQL implementation: SELECT name FROM article_categories ORDER BY display_order.
    return [...ARTICLE_CATEGORIES];
  }

  async getArticleTypes(): Promise<ArticleType[]> {
    // Future MSSQL implementation: SELECT DISTINCT article_type FROM articles.
    return [...ARTICLE_TYPES];
  }
}
