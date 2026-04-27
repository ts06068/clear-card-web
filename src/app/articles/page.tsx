import { ArticleTable } from "@/components/ArticleTable";
import { FilterPanel } from "@/components/FilterPanel";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { formatInteger } from "@/lib/format";
import { parseArticleSearchParams, toPlainSearchParams } from "@/lib/searchParams";
import { bibliometricRepository } from "@/server/repositories";
import { getFilterOptions, searchArticles } from "@/server/services";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ArticlesPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const rawParams = (await searchParams) ?? {};
  const filters = parseArticleSearchParams(rawParams);
  const [results, options] = await Promise.all([
    searchArticles(bibliometricRepository, filters),
    getFilterOptions(bibliometricRepository)
  ]);

  return (
    <>
      <PageHeader
        title="Article Search"
        subtitle="Article-level explorer with journal taxonomy, article category, source indexing, snapshot filters, citation trajectories, references, and co-citation context."
        eyebrow="Index"
      />

      <FilterPanel
        filters={filters}
        journals={options.journals}
        articleTypes={options.articleTypes}
        articleCategories={options.articleCategories}
      />

      <div className="mb-3 flex flex-col justify-between gap-2 border-b border-journal-line pb-3 sm:flex-row sm:items-end">
        <div>
          <p className="metadata-label">Results</p>
          <h2 className="text-lg font-semibold text-journal-ink">
            {formatInteger(results.totalItems)} articles
          </h2>
        </div>
        <p className="text-sm text-journal-muted">
          Showing page {results.page} of {results.totalPages}
        </p>
      </div>

      <ArticleTable articles={results.items} citationDataset={filters.dataset ?? "Scopus"} />
      <Pagination
        page={results.page}
        totalPages={results.totalPages}
        searchParams={toPlainSearchParams(rawParams)}
      />
    </>
  );
}
