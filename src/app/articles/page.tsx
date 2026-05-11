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
  const [results, options, allArticles] = await Promise.all([
    searchArticles(bibliometricRepository, filters),
    getFilterOptions(bibliometricRepository),
    bibliometricRepository.getArticles()
  ]);

  return (
    <>
      <PageHeader
        title="Article Explorer"
        subtitle="Article-level explorer with journal taxonomy, article category, source indexing, snapshot filters, citation trajectories, references, and co-citation context."
        eyebrow="Index"
      />

      <section className="mx-auto max-w-[1800px]">
        <FilterPanel
          filters={filters}
          journals={options.journals}
          articleTypes={options.articleTypes}
          articleCategories={options.articleCategories}
        />

        <div className="mb-3 flex flex-col justify-between gap-2 pb-3 sm:flex-row sm:items-end">
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

        <ArticleTable
          articles={results.items}
          citationDataset={filters.dataset ?? "Scopus"}
          sortable
          searchParams={toPlainSearchParams(rawParams)}
          sortCriteria={filters.order}
          allArticles={allArticles}
        />
        <Pagination
          page={results.page}
          totalPages={results.totalPages}
          searchParams={toPlainSearchParams(rawParams)}
        />
      </section>
    </>
  );
}
