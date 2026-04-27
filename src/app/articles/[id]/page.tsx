import { notFound } from "next/navigation";
import { ArticleTable } from "@/components/ArticleTable";
import { ArticleTrajectoryPanel } from "@/components/ArticleTrajectoryPanel";
import { ArticleTitleLink } from "@/components/ArticleTitleLink";
import { CoCitationGraph } from "@/components/charts/CoCitationGraph";
import { DataTable } from "@/components/DataTable";
import { MetadataBadge } from "@/components/MetadataBadge";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { formatDate, formatInteger } from "@/lib/format";
import { bibliometricRepository } from "@/server/repositories";
import { getArticleDetail } from "@/server/services";

export default async function ArticleDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getArticleDetail(bibliometricRepository, id);

  if (!detail) {
    notFound();
  }

  const { article } = detail;

  return (
    <>
      <PageHeader
        title={article.title}
        subtitle={`${article.journal} · ${formatDate(article.publicationDate)} · ${article.articleCategory}`}
        eyebrow="Article dossier"
      />

      <section className="mb-5 flex flex-wrap gap-2">
        <MetadataBadge tone="blue">{article.classification}</MetadataBadge>
        <MetadataBadge>{article.articleCategory}</MetadataBadge>
        <MetadataBadge>{article.articleType}</MetadataBadge>
        <MetadataBadge tone="accent">{article.journal}</MetadataBadge>
        {(["Scopus", "iCite", "WoS"] as const).map((source) => (
          <MetadataBadge
            key={source}
            tone={article.datasetIndexing[source].indexed ? "blue" : "neutral"}
          >
            {source}: {article.datasetIndexing[source].indexed ? "indexed" : "not indexed"}
          </MetadataBadge>
        ))}
      </section>

      <section className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Scopus total citations"
          value={formatInteger(article.totalCitationCount)}
        />
        <MetricCard
          label="Scopus 2-year citations"
          value={formatInteger(article.twoYearCitationCount)}
          helper={`${Math.round(article.twoYearCitationQuantile * 100)}th percentile in group`}
        />
        <MetricCard
          label="Fitness"
          value={article.fitness.toFixed(2)}
          helper={`${Math.round(article.fitnessQuantile * 100)}th percentile in group`}
        />
        <MetricCard label="Publication year" value={String(article.publicationYear)} />
        <MetricCard label="Pages" value={article.pageSpan} helper={`Vol ${article.volume}, issue ${article.issue}`} />
      </section>

      <section className="mb-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <article className="academic-card animate-soft-rise px-5 py-4">
          <div className="mb-5">
            <p className="metadata-label mb-2">Journal taxonomy header</p>
            <p className="text-base font-semibold text-journal-ink">{article.taxonomy.display}</p>
          </div>
          <div className="mb-5">
            <p className="metadata-label mb-2">Abstract</p>
            <p className="text-base leading-8 text-journal-slate">{article.abstract}</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <p className="metadata-label mb-2">Authors</p>
              <ul className="space-y-1.5 text-sm text-journal-ink">
                {article.authors.map((author) => (
                  <li key={`${author.name}-${author.affiliation}`}>{author.name}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="metadata-label mb-2">Affiliations</p>
              <ul className="space-y-1.5 text-sm leading-6 text-journal-slate">
                {article.affiliations.map((affiliation) => (
                  <li key={affiliation}>{affiliation}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-5">
            <p className="metadata-label mb-2">Keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {article.keywords.map((keyword) => (
                <MetadataBadge key={keyword}>{keyword}</MetadataBadge>
              ))}
            </div>
          </div>
        </article>

        <section className="grid gap-3">
          <article className="academic-card px-4 py-3">
            <p className="metadata-label mb-2">DOI</p>
            <p className="break-words text-sm font-semibold text-journal-ink">{article.doi}</p>
          </article>
          <article className="academic-card px-4 py-3">
            <p className="metadata-label mb-2">Original source categories</p>
            <div className="grid gap-2 text-sm">
              {(["Scopus", "iCite", "WoS"] as const).map((source) => (
                <div key={source} className="flex justify-between gap-3 border-b border-journal-line pb-2 last:border-b-0 last:pb-0">
                  <span className="font-semibold text-journal-ink">{source}</span>
                  <span className="text-right text-journal-slate">
                    {article.datasetIndexing[source].originalCategory}
                    <span className="block text-xs text-journal-muted">
                      {article.datasetIndexing[source].indexedSnapshots.length > 0
                        ? article.datasetIndexing[source].indexedSnapshots.join(", ")
                        : "No indexed snapshot"}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </article>
          <article className="academic-card px-4 py-3">
            <p className="metadata-label mb-2">Citation source comparison</p>
            <div className="grid gap-2 text-sm">
              {(["Scopus", "iCite", "WoS"] as const).map((source) => (
                <div key={source} className="flex justify-between gap-3">
                  <span className="text-journal-slate">{source}</span>
                  <span className="font-semibold tabular-nums text-journal-ink">
                    {article.datasetIndexing[source].totalCitationCount === null
                      ? "Not indexed"
                      : formatInteger(article.datasetIndexing[source].totalCitationCount)}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>

      <ArticleTrajectoryPanel
        trajectories={article.citationTrajectories}
        benchmarks={detail.benchmark}
        datasetIndexing={article.datasetIndexing}
      />

      <section className="mb-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          <div className="mb-3 border-b border-journal-line pb-3">
            <p className="metadata-label">Citation records</p>
            <h2 className="text-lg font-semibold text-journal-ink">
              Articles Citing This Article
            </h2>
          </div>
          <DataTable>
            <thead className="bg-journal-surface text-left text-xs uppercase text-journal-muted">
              <tr>
                <th className="px-4 py-3">Article</th>
                <th className="px-4 py-3">Journal</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Indexes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-journal-line">
              {detail.citingArticles.map((citingArticle) => (
                <tr key={citingArticle.id}>
                  <td className="px-4 py-3 text-sm font-semibold text-journal-ink">
                    <ArticleTitleLink id={citingArticle.id} title={citingArticle.title} />
                    <div className="mt-1 text-xs font-normal text-journal-muted">
                      {citingArticle.authors.join(", ")}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-journal-slate">{citingArticle.journal}</td>
                  <td className="px-4 py-3 text-sm text-journal-slate">
                    {formatDate(citingArticle.publicationDate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-journal-slate">
                    {citingArticle.articleCategory}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(["Scopus", "iCite", "WoS"] as const).map((source) => (
                        <MetadataBadge
                          key={source}
                          tone={citingArticle.datasetIndexing[source].indexed ? "blue" : "neutral"}
                        >
                          {source}:{" "}
                          {citingArticle.datasetIndexing[source].indexed
                            ? citingArticle.datasetIndexing[source].originalCategory
                            : "not indexed"}
                        </MetadataBadge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </div>
        <CoCitationGraph
          articleId={article.id}
          articleTitle={article.title}
          coCitedArticles={detail.coCitedArticles}
        />
      </section>

      <section className="mb-6 grid gap-5 lg:grid-cols-2">
        <section>
          <div className="mb-3 border-b border-journal-line pb-3">
            <p className="metadata-label">Reference list</p>
            <h2 className="text-lg font-semibold text-journal-ink">
              References Used by This Article
            </h2>
          </div>
          <div className="academic-card max-h-[420px] overflow-auto divide-y divide-journal-line">
            {detail.referenceArticles.map((reference) => (
              <article key={`${reference.doi}-${reference.title}`} className="px-4 py-3">
                <p className="text-sm font-semibold text-journal-ink">
                  {reference.id ? (
                    <ArticleTitleLink id={reference.id} title={reference.title} />
                  ) : (
                    reference.title
                  )}
                </p>
                <p className="mt-1 text-xs leading-5 text-journal-muted">
                  {reference.authors.join(", ")} · {reference.journal} · {reference.publicationYear} · {reference.doi}
                </p>
              </article>
            ))}
          </div>
        </section>
        <section>
          <div className="mb-3 border-b border-journal-line pb-3">
            <p className="metadata-label">Co-citation list</p>
            <h2 className="text-lg font-semibold text-journal-ink">
              Co-cited Articles
            </h2>
          </div>
          <ArticleTable articles={detail.coCitedArticles} />
        </section>
      </section>

      <section>
        <div className="mb-3 border-b border-journal-line pb-3">
          <p className="metadata-label">Related records</p>
          <h2 className="text-lg font-semibold text-journal-ink">
            Similar Articles
          </h2>
        </div>
        <ArticleTable articles={detail.similarArticles} />
      </section>
    </>
  );
}
