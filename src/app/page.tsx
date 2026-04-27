import { ArticleTable } from "@/components/ArticleTable";
import {
  CategoryDistributionChart,
  JournalVolumeChart,
  PublicationYearVolumeChart
} from "@/components/charts/BibliometricCharts";
import { CitationNetworkExplorer } from "@/components/charts/CitationNetworkExplorer";
import { MetricCard } from "@/components/MetricCard";
import { formatInteger, formatOneDecimal } from "@/lib/format";
import { bibliometricRepository } from "@/server/repositories";
import { getHomeDashboardData } from "@/server/services";

export default async function HomePage() {
  const dashboard = await getHomeDashboardData(bibliometricRepository);

  return (
    <>
      <section className="mb-6 animate-gentle-pop overflow-hidden border border-journal-line bg-[color:var(--card-bg)] p-5 backdrop-blur-xl sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-end">
          <div>
            <p className="metadata-label">CLEAR-CARD interactive atlas</p>
            <h1 className="gradient-title mt-3 max-w-5xl text-5xl font-semibold leading-[1.02] sm:text-6xl">
              Citation networks reveal the drift from original research to secondary literature.
            </h1>
            <p className="mt-4 max-w-3xl text-xl leading-8 text-journal-slate">
              Search article dossiers, compare Scopus and iCite snapshots, and explore manuscript result tables as live charts.
            </p>
          </div>
          <form action="/articles" className="grid gap-3 border border-journal-line bg-white/70 p-4 shadow-hairline dark:bg-white/5">
            <label className="metadata-label" htmlFor="home-search">
              Article search
            </label>
            <div className="flex gap-2">
              <input
                id="home-search"
                name="q"
                placeholder="Search title, DOI, taxonomy, author, keyword"
                className="min-w-0 flex-1 border border-journal-line bg-white/85 px-4 py-4 text-base text-journal-ink outline-none transition focus:border-journal-blue focus:ring-2 focus:ring-journal-blue/20 dark:bg-white/5"
              />
              <button className="border border-journal-navy bg-journal-navy px-5 py-4 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#102D52]">
                Search
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-journal-muted">
              <span>ORA</span>
              <span>NORA</span>
              <span>GSS</span>
              <span>fitness</span>
              <span>2-year citations</span>
              <span>taxonomy header</span>
            </div>
          </form>
        </div>
      </section>

      <section className="mb-6">
        <CitationNetworkExplorer data={dashboard.citationNetwork} />
      </section>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Total articles"
          value={formatInteger(dashboard.metrics.totalArticles)}
        />
        <MetricCard
          label="Total citations"
          value={formatInteger(dashboard.metrics.totalCitations)}
        />
        <MetricCard
          label="Mean 2-year citations"
          value={formatOneDecimal(dashboard.metrics.meanTwoYearCitationCount)}
        />
        <MetricCard
          label="Journals"
          value={formatInteger(dashboard.metrics.journalCount)}
        />
        <MetricCard
          label="Categories"
          value={formatInteger(dashboard.metrics.categoryCount)}
        />
      </section>

      <section className="mb-6 grid gap-5 lg:grid-cols-2">
        <JournalVolumeChart data={dashboard.articleVolumeByJournal} />
        <PublicationYearVolumeChart data={dashboard.articleVolumeByYear} />
      </section>

      <section className="mb-6">
        <CategoryDistributionChart data={dashboard.categoryDistribution} />
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="metadata-label">Citation leaders</p>
            <h2 className="text-lg font-semibold text-journal-ink">
              Top 10 Articles by Total Citation Count
            </h2>
          </div>
        </div>
        <ArticleTable articles={dashboard.topArticles} showRank />
      </section>
    </>
  );
}
