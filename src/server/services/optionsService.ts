import { BibliometricRepository } from "@/server/repositories";

export async function getFilterOptions(repository: BibliometricRepository) {
  const [journals, articleCategories, articleTypes] = await Promise.all([
    repository.getJournals(),
    repository.getArticleCategories(),
    repository.getArticleTypes()
  ]);

  return {
    journals,
    articleCategories,
    articleTypes
  };
}
