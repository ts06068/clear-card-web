import type { Article, CitationDataset, TopArticleDatum } from "@/types/bibliometric";
import { formatInteger } from "@/lib/format";
import { ArticleTitleLink } from "./ArticleTitleLink";
import { DataTable } from "./DataTable";
import { MetadataBadge } from "./MetadataBadge";

type ArticleRow = Article | TopArticleDatum;

export function ArticleTable({
  articles,
  showRank = false,
  citationDataset = "Scopus"
}: {
  articles: ArticleRow[];
  showRank?: boolean;
  citationDataset?: CitationDataset;
}) {
  if (articles.length === 0) {
    return (
      <div className="academic-card px-4 py-8 text-center text-sm text-journal-muted">
        No articles match the current criteria.
      </div>
    );
  }

  return (
    <DataTable>
      <thead className="bg-journal-surface text-left text-xs uppercase text-journal-muted">
        <tr>
          {showRank ? <th className="w-14 px-4 py-3">Rank</th> : null}
          <th className="min-w-[420px] px-4 py-3">Article</th>
          <th className="px-4 py-3">Journal</th>
          <th className="px-4 py-3">Year</th>
          <th className="px-4 py-3">Category</th>
          <th className="px-4 py-3">Taxonomy</th>
          <th className="px-4 py-3 text-right">{citationDataset} total</th>
          <th className="px-4 py-3 text-right">{citationDataset} 2-year</th>
          <th className="px-4 py-3 text-right">{citationDataset} fitness</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-journal-line bg-white/80 dark:bg-white/[0.03]">
        {articles.map((article, index) => (
          <tr key={article.id} className="align-top transition hover:bg-journal-surface/70">
            {showRank ? (
              <td className="px-4 py-3 text-sm font-semibold text-journal-muted">
                {index + 1}
              </td>
            ) : null}
            <td className="px-4 py-3">
              <ArticleTitleLink id={article.id} title={article.title} />
              <div className="mt-2 flex flex-wrap gap-1.5">
                <MetadataBadge tone="blue">{article.articleType}</MetadataBadge>
                <MetadataBadge tone={article.classification === "ORA" ? "accent" : "neutral"}>
                  {article.classification}
                </MetadataBadge>
                {(["Scopus", "iCite", "WoS"] as const).map((source) => (
                  <MetadataBadge
                    key={source}
                    tone={article.datasetIndexing[source].indexed ? "blue" : "neutral"}
                  >
                    {source}:{" "}
                    {article.datasetIndexing[source].indexed
                      ? article.datasetIndexing[source].originalCategory
                      : "not indexed"}
                  </MetadataBadge>
                ))}
              </div>
            </td>
            <td className="px-4 py-3 text-journal-slate">{article.journal}</td>
            <td className="px-4 py-3 text-journal-slate">{article.publicationYear}</td>
            <td className="px-4 py-3 text-journal-slate">{article.articleCategory}</td>
            <td className="max-w-[260px] px-4 py-3 text-xs leading-5 text-journal-muted">
              {"taxonomyDisplay" in article
                ? article.taxonomyDisplay
                : article.taxonomy.display}
            </td>
            <td className="px-4 py-3 text-right tabular-nums text-journal-ink">
              {formatMetric(article.datasetIndexing[citationDataset].totalCitationCount)}
            </td>
            <td className="px-4 py-3 text-right tabular-nums text-journal-slate">
              {formatMetric(article.datasetIndexing[citationDataset].twoYearCitationCount)}
            </td>
            <td className="px-4 py-3 text-right tabular-nums text-journal-slate">
              {formatMetric(article.datasetIndexing[citationDataset].fitness, 2)}
            </td>
          </tr>
        ))}
      </tbody>
    </DataTable>
  );
}

function formatMetric(value: number | null, digits = 0) {
  if (value === null) {
    return "NA";
  }

  return digits > 0 ? value.toFixed(digits) : formatInteger(value);
}
