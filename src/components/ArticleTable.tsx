import Link from "next/link";
import type { Article, CitationDataset, TopArticleDatum } from "@/types/bibliometric";
import type { ArticleOrderKey, ArticleSortCriterion } from "@/types/bibliometric";
import { formatInteger } from "@/lib/format";
import type { PlainSearchParams } from "@/lib/searchParams";
import {
  citationTrajectoryMomentum,
  jifContributionPercent
} from "@/lib/articleAnalytics";
import { ArticleTitleLink } from "./ArticleTitleLink";
import { DataTable } from "./DataTable";
import { MetadataBadge } from "./MetadataBadge";

type ArticleRow = Article | TopArticleDatum;
type SortableColumn = {
  key: ArticleOrderKey;
  label: string;
  align?: "left" | "right";
  className?: string;
};

const sortableColumns: SortableColumn[] = [
  { key: "title", label: "Article", className: "min-w-[420px]" },
  { key: "journal", label: "Journal" },
  { key: "publicationYear", label: "Year" },
  { key: "articleCategory", label: "Category" },
  { key: "taxonomy", label: "Taxonomy" },
  { key: "totalCitations", label: "total", align: "right" },
  { key: "twoYearCitations", label: "2-year", align: "right" },
  { key: "fitness", label: "fitness", align: "right" },
  { key: "jifYearOneContribution", label: "% to JIF y+1", align: "right" },
  { key: "jifYearTwoContribution", label: "% to JIF y+2", align: "right" },
  { key: "citationTrajectory", label: "Trajectory", align: "right" }
];

export function ArticleTable({
  articles,
  showRank = false,
  citationDataset = "Scopus",
  sortable = false,
  searchParams,
  sortCriteria = [],
  allArticles = []
}: {
  articles: ArticleRow[];
  showRank?: boolean;
  citationDataset?: CitationDataset;
  sortable?: boolean;
  searchParams?: PlainSearchParams;
  sortCriteria?: ArticleSortCriterion[];
  allArticles?: Article[];
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
          {sortableColumns.map((column) => (
            <th
              key={column.key}
              className={`px-4 py-3 ${column.align === "right" ? "text-right" : ""} ${
                column.className ?? ""
              }`}
            >
              {sortable && searchParams ? (
                <SortableHeader
                  column={column}
                  searchParams={searchParams}
                  sortCriteria={sortCriteria}
                  citationDataset={citationDataset}
                />
              ) : (
                headerLabel(column, citationDataset)
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-journal-line bg-white/80 dark:bg-white/[0.03]">
        {articles.map((article, index) => {
          const fullArticle = isFullArticle(article) ? article : null;
          const jifYearOne = fullArticle
            ? jifContributionPercent(fullArticle, allArticles, citationDataset, 1)
            : null;
          const jifYearTwo = fullArticle
            ? jifContributionPercent(fullArticle, allArticles, citationDataset, 2)
            : null;

          return (
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
              <td className="px-4 py-3 text-right tabular-nums text-journal-slate">
                {formatPercent(jifYearOne)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-journal-slate">
                {formatPercent(jifYearTwo)}
              </td>
              <td className="px-4 py-3 text-right">
                {fullArticle ? (
                  <Sparkline
                    points={fullArticle.citationTrajectories[citationDataset].map(
                      (point) => point.citations
                    )}
                    value={citationTrajectoryMomentum(fullArticle, citationDataset)}
                  />
                ) : (
                  <span className="text-xs text-journal-muted">NA</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </DataTable>
  );
}

function isFullArticle(article: ArticleRow): article is Article {
  return "citationTrajectories" in article;
}

function headerLabel(column: SortableColumn, citationDataset: CitationDataset) {
  if (column.key === "totalCitations" || column.key === "twoYearCitations" || column.key === "fitness") {
    return `${citationDataset} ${column.label}`;
  }

  return column.label;
}

function SortableHeader({
  column,
  searchParams,
  sortCriteria,
  citationDataset
}: {
  column: SortableColumn;
  searchParams: PlainSearchParams;
  sortCriteria: ArticleSortCriterion[];
  citationDataset: CitationDataset;
}) {
  const activeIndex = sortCriteria.findIndex((criterion) => criterion.key === column.key);
  const active = activeIndex >= 0 ? sortCriteria[activeIndex] : undefined;
  const directionLabel = active?.direction === "asc" ? "ascending" : "descending";

  return (
    <Link
      href={sortHref(searchParams, sortCriteria, column.key)}
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition hover:bg-white/80 hover:text-journal-ink dark:hover:bg-white/10 ${
        column.align === "right" ? "justify-end" : ""
      }`}
      title={
        active
          ? `Sorted ${directionLabel}; priority ${activeIndex + 1}. Click to change.`
          : "Add this column to the sort order"
      }
    >
      <span>{headerLabel(column, citationDataset)}</span>
      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/70 px-1 text-[10px] font-bold text-journal-slate shadow-hairline dark:bg-white/10">
        {active ? `${active.direction === "asc" ? "↑" : "↓"}${activeIndex + 1}` : "↕"}
      </span>
    </Link>
  );
}

function sortHref(
  searchParams: PlainSearchParams,
  sortCriteria: ArticleSortCriterion[],
  key: ArticleOrderKey
) {
  const params = new URLSearchParams();

  for (const [paramKey, value] of Object.entries(searchParams)) {
    if (paramKey === "page" || paramKey === "order") {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => params.append(paramKey, item));
    } else {
      params.set(paramKey, value);
    }
  }

  const nextCriteria = sortCriteria
    .map((criterion) => ({ ...criterion }))
    .filter((criterion, index, criteria) =>
      criteria.findIndex((candidate) => candidate.key === criterion.key) === index
    );
  const currentIndex = nextCriteria.findIndex((criterion) => criterion.key === key);

  if (currentIndex === -1) {
    nextCriteria.push({ key, direction: "asc" });
  } else if (nextCriteria[currentIndex].direction === "asc") {
    nextCriteria[currentIndex] = { key, direction: "desc" };
  } else {
    nextCriteria.splice(currentIndex, 1);
  }

  nextCriteria.forEach((criterion) => {
    params.append("order", `${criterion.key}:${criterion.direction}`);
  });

  const query = params.toString();
  return query ? `/articles?${query}` : "/articles";
}

function formatMetric(value: number | null, digits = 0) {
  if (value === null) {
    return "NA";
  }

  return digits > 0 ? value.toFixed(digits) : formatInteger(value);
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "NA";
  }

  return `${value.toFixed(value >= 10 ? 1 : 2)}%`;
}

function Sparkline({ points, value }: { points: number[]; value: number }) {
  const width = 112;
  const height = 34;
  const max = Math.max(...points, 1);
  const denominator = Math.max(points.length - 1, 1);
  const polyline = points
    .map((point, index) => {
      const x = (index / denominator) * width;
      const y = height - (point / max) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="inline-flex min-w-[132px] items-center justify-end gap-2">
      <svg
        aria-label="Citation trajectory"
        viewBox={`0 0 ${width} ${height}`}
        className="h-9 w-28 overflow-visible"
      >
        <polyline
          points={polyline}
          fill="none"
          stroke="var(--color-blue)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.4"
        />
      </svg>
      <span className="text-xs font-semibold tabular-nums text-journal-muted">
        {formatInteger(value)}
      </span>
    </div>
  );
}
