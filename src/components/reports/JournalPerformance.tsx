"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import type { EChartsOption } from "echarts";
import { ArticleTitleLink } from "@/components/ArticleTitleLink";
import { EChart } from "@/components/charts/EChartCard";
import {
  citationCountInYear,
  isCitableItem,
  jifCitableItems
} from "@/lib/articleAnalytics";
import { formatInteger, formatOneDecimal } from "@/lib/format";
import { CITATION_DATASETS, DATASET_SNAPSHOTS, JOURNALS } from "@/types/bibliometric";
import type {
  Article,
  ArticleCategory,
  CitationDataset,
  DatasetSnapshot,
  Journal
} from "@/types/bibliometric";

type ReportPage = "metrics" | "performance" | "age";
type HorizonMetric = "1m" | "3m" | "6m" | "1y" | "2y" | "3y" | "5y" | "10y" | "fitness";
type SortMode = "top" | "bottom";
type TimeGranularity = "year" | "month" | "day";

const pageLabels: Record<ReportPage, string> = {
  metrics: "Journal Metrics",
  performance: "Citation Performance",
  age: "Citation Age"
};

const reportPages: ReportPage[] = ["metrics", "performance", "age"];

const categoryPalette: Record<string, string> = {
  "Original Research": "#1A73E8",
  Review: "#12A182",
  "Meta-analysis": "#7C4DFF",
  "Guideline / Statement / Statistics": "#F9AB00",
  Editorial: "#D93025",
  "Other Non-original": "#5F6368"
};

const quantileClasses = [
  "bg-blue-500/14",
  "bg-teal-500/14",
  "bg-amber-500/16",
  "bg-red-500/12",
  "bg-journal-surface/80 dark:bg-white/8"
];

const horizonOptions: { id: HorizonMetric; label: string }[] = [
  { id: "1m", label: "1m citations" },
  { id: "3m", label: "3m citations" },
  { id: "6m", label: "6m citations" },
  { id: "1y", label: "1y citations" },
  { id: "2y", label: "2y citations" },
  { id: "3y", label: "3y citations" },
  { id: "5y", label: "5y citations" },
  { id: "10y", label: "10y citations" },
  { id: "fitness", label: "Fitness" }
];

export function JournalPerformance({
  articles,
  citationDataset,
  setCitationDataset,
  snapshot,
  setSnapshot,
  setWorkspacePage
}: {
  articles: Article[];
  citationDataset: CitationDataset;
  setCitationDataset: (value: CitationDataset) => void;
  snapshot: DatasetSnapshot;
  setSnapshot: (value: DatasetSnapshot) => void;
  setWorkspacePage: (value: "temporal" | "journal") => void;
}) {
  const [page, setPage] = useState<ReportPage>("metrics");
  const [journal, setJournal] = useState<Journal>(JOURNALS[0]);
  const [selectedJifYear, setSelectedJifYear] = useState(2024);
  const [category, setCategory] = useState<ArticleCategory>("Original Research");
  const [publicationYear, setPublicationYear] = useState(2022);
  const [horizonMetric, setHorizonMetric] = useState<HorizonMetric>("2y");
  const [sortMode, setSortMode] = useState<SortMode>("top");

  const journalArticles = useMemo(
    () => articles.filter((article) => article.journal === journal),
    [articles, journal]
  );
  const categories = useMemo(
    () => Array.from(new Set(journalArticles.map((article) => article.articleCategory))),
    [journalArticles]
  );
  const publicationYears = useMemo(
    () => Array.from(new Set(journalArticles.map((article) => article.publicationYear))).sort((a, b) => b - a),
    [journalArticles]
  );
  const boundedCategory = categories.includes(category) ? category : categories[0] ?? "Original Research";
  const boundedPublicationYear = publicationYears.includes(publicationYear)
    ? publicationYear
    : publicationYears[0] ?? 2022;
  const jifYears = useMemo(() => {
    const years = new Set<number>();
    journalArticles.forEach((article) => {
      years.add(article.publicationYear + 1);
      years.add(article.publicationYear + 2);
    });
    return Array.from(years).filter((year) => year >= 2010 && year <= 2024).sort((a, b) => a - b);
  }, [journalArticles]);
  const boundedJifYear = jifYears.includes(selectedJifYear)
    ? selectedJifYear
    : jifYears[jifYears.length - 1] ?? 2024;
  const jifRows = useMemo(
    () => jifYears.map((year) => makeJifYearRow(articles, journal, year, citationDataset)),
    [articles, citationDataset, jifYears, journal]
  );
  const currentJif = jifRows.find((row) => row.year === boundedJifYear) ?? jifRows[jifRows.length - 1];
  const previousJif = jifRows.find((row) => row.year === (currentJif?.year ?? 0) - 1);
  const contributionRows = useMemo(
    () =>
      (currentJif?.citableItems ?? [])
        .map((article) => {
          const citations = jifArticleContribution(article, citationDataset, currentJif.year);
          return {
            article,
            citations,
            proportion: currentJif.numerator === 0 ? 0 : (citations / currentJif.numerator) * 100
          };
        })
        .sort((a, b) => b.citations - a.citations),
    [citationDataset, currentJif]
  );

  const groupArticles = useMemo(
    () =>
      journalArticles.filter(
        (article) =>
          article.articleCategory === boundedCategory &&
          article.publicationYear === boundedPublicationYear
      ),
    [boundedCategory, boundedPublicationYear, journalArticles]
  );
  const performanceRows = useMemo(
    () =>
      groupArticles
        .map((article) => ({
          article,
          value: valueForHorizon(article, citationDataset, horizonMetric),
          fitness: article.datasetIndexing[citationDataset].fitness ?? article.fitness
        }))
        .sort((a, b) => (sortMode === "top" ? b.value - a.value : a.value - b.value)),
    [citationDataset, groupArticles, horizonMetric, sortMode]
  );
  const trajectoryRows = useMemo(
    () => makeAverageTrajectory(groupArticles, citationDataset),
    [citationDataset, groupArticles]
  );
  const timingRows = useMemo(
    () => groupArticles.map((article) => makeTimingRow(article, citationDataset)),
    [citationDataset, groupArticles]
  );
  const citationLinks = useMemo(
    () => makeCitationLinks(articles, groupArticles),
    [articles, groupArticles]
  );

  return (
    <article className="mx-auto max-w-6xl pb-36">
      <header className="mb-8 border-b border-journal-line pb-6">
        <p className="metadata-label">Journal Performance Report</p>
        <div className="mt-2 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <h2 className="text-4xl font-semibold leading-tight text-journal-ink">
              {journal}
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-journal-slate">
              The report follows the evidence chain behind journal impact: metric trends, the
              articles forming the numerator and denominator, and the age profile of citations.
              The selected data source, snapshot, journal, and cohort define a consistent view of
              the citation network behind the editorial signal.
            </p>
          </div>
        </div>
      </header>

      <div key={page} className="animate-report-page">
        {page === "metrics" && currentJif ? (
          <JournalMetricsPage
            jifRows={jifRows}
            currentJif={currentJif}
            previousJif={previousJif}
            contributionRows={contributionRows}
          />
        ) : null}

        {page === "performance" ? (
          <CitationPerformancePage
            horizonMetric={horizonMetric}
            sortMode={sortMode}
            setSortMode={setSortMode}
            rows={performanceRows}
            trajectoryRows={trajectoryRows}
            timingRows={timingRows}
          />
        ) : null}

        {page === "age" ? (
          <CitationAgePage
            citationLinks={citationLinks}
            timingRows={timingRows}
          />
        ) : null}
      </div>

      <ViewportOverlay>
        <JournalPageSideNavigation page={page} setPage={setPage} />
        <JournalReportToolbar
          page={page}
          setWorkspacePage={setWorkspacePage}
          citationDataset={citationDataset}
          setCitationDataset={setCitationDataset}
          snapshot={snapshot}
          setSnapshot={setSnapshot}
          journal={journal}
          setJournal={setJournal}
          jifYear={boundedJifYear}
          setJifYear={setSelectedJifYear}
          jifYears={jifYears}
          categories={categories}
          category={boundedCategory}
          setCategory={setCategory}
          publicationYears={publicationYears}
          publicationYear={boundedPublicationYear}
          setPublicationYear={setPublicationYear}
          horizonMetric={horizonMetric}
          setHorizonMetric={setHorizonMetric}
          sortMode={sortMode}
          setSortMode={setSortMode}
        />
      </ViewportOverlay>

      <p className="mt-8 border-t border-journal-line pt-4 text-xs leading-5 text-journal-muted">
        Source: {citationDataset}, snapshot {snapshot}. The report uses the local CLEAR-CARD
        citation network consistently for numerator, denominator, age, and article-level
        attribution calculations.
      </p>

    </article>
  );
}

function JournalMetricsPage({
  jifRows,
  currentJif,
  previousJif,
  contributionRows
}: {
  jifRows: JifYearRow[];
  currentJif: JifYearRow;
  previousJif?: JifYearRow;
  contributionRows: ContributionRow[];
}) {
  const [metricGranularity, setMetricGranularity] = useState<TimeGranularity>("year");
  const [contributionLimit, setContributionLimit] = useState(14);

  return (
    <section className="space-y-8">
      <ReportSectionHeader
        kicker="Page 1"
        title="Journal Metrics"
        body="Journal impact is best read as a composition of numerator and denominator rather than as a single number. The headline metric is shown with the citable item base, non-citable output, and the individual articles that account for the numerator in the selected JIF year."
      />
      <MetricNarrativeGrid>
        <DeltaNumber label="JIF" value={currentJif.jif} previous={previousJif?.jif} digits={2} />
        <DeltaNumber label="Numerator citations" value={currentJif.numerator} previous={previousJif?.numerator} />
        <DeltaNumber label="Citable denominator" value={currentJif.denominator} previous={previousJif?.denominator} />
        <DeltaNumber label="Non-citable items" value={currentJif.nonCitableItems.length} previous={previousJif?.nonCitableItems.length} />
      </MetricNarrativeGrid>

      <FigureBlock
        title="Journal metric trajectory"
        body="The line chart follows JIF, 5-year JIF, SJR-like influence, and SNIP-like normalization over time. It gives the editor a compact view of whether changes in the current year are part of a durable trajectory or a short-lived deviation."
        controls={
          <GranularityButtons
            label="Granularity"
            value={metricGranularity}
            onChange={setMetricGranularity}
          />
        }
      >
        <EChart
          height={360}
          option={metricTrendOption(jifRows, metricGranularity)}
        />
      </FigureBlock>

      <FigureBlock
        title="Contribution to the JIF numerator"
        body="Each bar is an article in the denominator window. The table below keeps only the article-level evidence needed to audit or model the selected JIF year."
        controls={
          <PlotSliderControl
            label="Articles"
            min={1}
            max={Math.max(1, Math.min(contributionRows.length, 30))}
            value={Math.min(contributionLimit, Math.max(1, Math.min(contributionRows.length, 30)))}
            onChange={setContributionLimit}
          />
        }
      >
        <EChart
          height={320}
          option={topContributionOption(contributionRows.slice(0, contributionLimit))}
        />
      </FigureBlock>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <h3 className="text-2xl font-semibold text-journal-ink">Top contributing articles</h3>
          <p className="mt-2 text-sm leading-6 text-journal-slate">
            Items are shaded by contribution quantile. The first band is the top 10%, followed by
            25%, 50%, 75%, and the remainder. This helps editors identify whether the metric is
            broadly distributed or concentrated in a few papers.
          </p>
          <div className="mt-4 divide-y divide-journal-line">
            {contributionRows.slice(0, 10).map((row, index) => (
              <div
                key={row.article.id}
                className={`grid gap-3 px-3 py-3 transition hover:bg-journal-surface/80 sm:grid-cols-[minmax(0,1fr)_90px_90px] ${quantileClass(index, contributionRows.length)}`}
              >
                <ArticleSummary article={row.article} />
                <span className="text-right text-sm font-semibold tabular-nums text-journal-ink">
                  {formatInteger(row.citations)}
                </span>
                <span className="text-right text-sm tabular-nums text-journal-slate">
                  {formatPct(row.proportion)}
                </span>
              </div>
            ))}
          </div>
          <FullListLink articles={contributionRows.map((row) => row.article)} label="Open full contributing article list in Article Explorer" />
        </section>
        <aside className="space-y-6">
          <EvidenceList title="Citable denominator" articles={currentJif.citableItems} />
          <EvidenceList title="Non-citable items" articles={currentJif.nonCitableItems} />
        </aside>
      </div>
    </section>
  );
}

function CitationPerformancePage({
  horizonMetric,
  sortMode,
  setSortMode,
  rows,
  trajectoryRows,
  timingRows
}: {
  horizonMetric: HorizonMetric;
  sortMode: SortMode;
  setSortMode: (value: SortMode) => void;
  rows: PerformanceRow[];
  trajectoryRows: TrajectoryRow[];
  timingRows: TimingRow[];
}) {
  const [binCount, setBinCount] = useState(8);
  const [trajectoryGranularity, setTrajectoryGranularity] = useState<TimeGranularity>("year");
  const means = horizonOptions.map((option) => ({
    label: option.label,
    value: mean(rows.map((row) => metricValueForRow(row, option.id)))
  }));
  const bins = useMemo(() => makeHistogram(rows, binCount), [binCount, rows]);
  const rankedRows = sortMode === "top" ? rows.slice(0, 18) : [...rows].reverse().slice(0, 18);

  return (
    <section className="space-y-8">
      <ReportSectionHeader
        kicker="Page 2"
        title="Citation Performance"
        body="Citation performance describes how attention is distributed inside a journal-year-category cohort. Short windows capture immediate uptake, longer windows describe persistence, and fitness provides a complementary article-level signal that is less tied to simple citation volume."
      />
      <MetricStrip items={means} />

      <FigureBlock
        title="Citation and fitness distribution"
        body="The histogram groups the selected cohort by the active metric, keeping the distribution readable while the detailed article list remains close to the evidence being summarized."
        controls={
          <PlotSliderControl
            label="Bins"
            min={3}
            max={30}
            value={binCount}
            onChange={setBinCount}
          />
        }
      >
        <EChart
          height={360}
          option={histogramOption(bins, horizonMetric)}
        />
      </FigureBlock>

      <FigureBlock
        title="Average temporal and cumulative trajectory"
        body="The trajectory summarizes how quickly the selected cohort accumulates citations after publication. Editors can use this to distinguish immediate uptake from durable accumulation."
        controls={
          <GranularityButtons
            label="Granularity"
            value={trajectoryGranularity}
            onChange={setTrajectoryGranularity}
          />
        }
      >
        <EChart height={340} option={trajectoryOption(trajectoryRows, trajectoryGranularity)} />
      </FigureBlock>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold text-journal-ink">
                {sortMode === "top" ? "Top-performing articles" : "Bottom-performing articles"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-journal-slate">
                List items include publication year, category, lead author, and the selected metric.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSortMode(sortMode === "top" ? "bottom" : "top")}
              className="rounded-full bg-journal-control px-4 py-2 text-sm font-semibold text-journal-control-ink shadow-[0_8px_20px_rgba(60,64,67,0.16)] transition hover:-translate-y-0.5"
            >
              Show {sortMode === "top" ? "bottom" : "top"}
            </button>
          </div>
          <ArticleEvidenceStack rows={rankedRows} metric={horizonMetric} />
        </div>
        <aside className="space-y-6">
          <TimingList title="High early gain" rows={[...timingRows].sort((a, b) => b.early - a.early).slice(0, 8)} mode="early" />
          <TimingList title="High intermediate gain" rows={[...timingRows].sort((a, b) => b.intermediate - a.intermediate).slice(0, 8)} mode="intermediate" />
          <TimingList title="High late gain" rows={[...timingRows].sort((a, b) => b.late - a.late).slice(0, 8)} mode="late" />
        </aside>
      </section>
    </section>
  );
}

function CitationAgePage({
  citationLinks,
  timingRows
}: {
  citationLinks: CitationLink[];
  timingRows: TimingRow[];
}) {
  const [ageGranularity, setAgeGranularity] = useState<TimeGranularity>("month");
  const [ageBinSize, setAgeBinSize] = useState(12);
  const [journalSliceCount, setJournalSliceCount] = useState(6);
  const [publicationGranularity, setPublicationGranularity] = useState<TimeGranularity>("year");
  const ageBinRange = binSizeRange(ageGranularity);
  const boundedAgeBinSize = Math.min(Math.max(ageBinSize, ageBinRange.min), ageBinRange.max);
  const ageBins = useMemo(
    () => makeAgeBins(citationLinks, ageGranularity, boundedAgeBinSize),
    [ageGranularity, boundedAgeBinSize, citationLinks]
  );
  const allCitingJournalRows = useMemo(
    () => countBy(citationLinks, (link) => link.citing.journal),
    [citationLinks]
  );
  const journalSliceMax = Math.max(3, Math.min(12, allCitingJournalRows.length));
  const boundedJournalSliceCount = Math.min(journalSliceCount, journalSliceMax);
  const citingJournalRows = useMemo(
    () => allCitingJournalRows.slice(0, boundedJournalSliceCount),
    [allCitingJournalRows, boundedJournalSliceCount]
  );
  const citingPublicationRows = useMemo(
    () => countByPublicationDate(citationLinks, publicationGranularity),
    [citationLinks, publicationGranularity]
  );
  const shortTerm = [...timingRows].sort((a, b) => b.early - a.early).slice(0, 10);
  const enduring = [...timingRows].sort((a, b) => b.late - a.late).slice(0, 10);

  return (
    <section className="space-y-8">
      <ReportSectionHeader
        kicker="Page 3"
        title="Citation Age"
        body="Citation age measures the elapsed time from target publication to citing publication. Short citation age indicates rapid uptake after publication, while a long tail of older citations suggests that articles remain useful after the usual impact-factor window has closed."
      />
      <FigureBlock
        title="Citation age histogram"
        body="The histogram shows elapsed time between publication and citation. A short left-side concentration points to rapid uptake, while a long right tail suggests articles that remain useful after the usual impact-factor window."
        controls={
          <div className="flex flex-wrap items-center gap-2">
            <GranularityButtons
              label="Unit"
              value={ageGranularity}
              onChange={(value) => {
                setAgeGranularity(value);
                setAgeBinSize(defaultBinSize(value));
              }}
            />
            <PlotSliderControl
              label="Bin size"
              min={ageBinRange.min}
              max={ageBinRange.max}
              value={boundedAgeBinSize}
              onChange={setAgeBinSize}
              suffix={ageGranularity === "day" ? "d" : ageGranularity === "month" ? "m" : "y"}
            />
          </div>
        }
      >
        <EChart
          height={360}
          option={ageHistogramOption(ageBins)}
        />
      </FigureBlock>

      <section className="grid gap-8 lg:grid-cols-2">
        <FigureBlock
          title="Citing journal composition"
          body="This chart shows which journals cite the selected cohort, helping identify whether influence is concentrated inside the same journal family or distributed across the cardiovascular literature."
          controls={
            <PlotSliderControl
              label="Slices"
              min={3}
              max={journalSliceMax}
              value={boundedJournalSliceCount}
              onChange={setJournalSliceCount}
            />
          }
        >
          <EChart
            height={320}
            option={compositionOption(citingJournalRows)}
          />
        </FigureBlock>
        <FigureBlock
          title="Citing publication period"
          body="Publication-period composition shows whether citations arrive from a narrow burst or a continuing stream of newer articles."
          controls={
            <GranularityButtons
              label="Granularity"
              value={publicationGranularity}
              onChange={setPublicationGranularity}
            />
          }
        >
          <EChart
            height={320}
            option={barCountOption(citingPublicationRows)}
          />
        </FigureBlock>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <TimingList title="Short-term impact articles" rows={shortTerm} mode="early" />
        <TimingList title="Enduring impact articles" rows={enduring} mode="late" />
      </section>
    </section>
  );
}

function ReportSectionHeader({
  kicker,
  title,
  body
}: {
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <section className="max-w-4xl">
      <p className="metadata-label">{kicker}</p>
      <h2 className="mt-2 text-3xl font-semibold text-journal-ink">{title}</h2>
      <p className="mt-4 text-lg leading-8 text-journal-slate">{body}</p>
    </section>
  );
}

function FigureBlock({
  title,
  body,
  controls,
  children
}: {
  title: string;
  body: string;
  controls?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-journal-line pt-5">
      <div className="mb-4">
        <div>
          <h3 className="text-2xl font-semibold text-journal-ink">{title}</h3>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-journal-slate">{body}</p>
        </div>
      </div>
      <div className={`relative rounded-lg bg-white/44 p-2 shadow-hairline dark:bg-white/[0.03] ${controls ? "pt-24 sm:pt-16" : ""}`}>
        {controls ? (
          <div className="absolute right-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap justify-end gap-2">
            {controls}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}

function GranularityButtons({
  label,
  value,
  onChange
}: {
  label: string;
  value: TimeGranularity;
  onChange: (value: TimeGranularity) => void;
}) {
  const options: { value: TimeGranularity; label: string }[] = [
    { value: "year", label: "Year" },
    { value: "month", label: "Month" },
    { value: "day", label: "Day" }
  ];

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-white/90 p-1 shadow-hairline backdrop-blur-xl dark:bg-[#1c1e24]/90">
      <span className="px-2 text-[10px] font-semibold uppercase text-journal-muted">{label}</span>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            value === option.value
              ? "bg-journal-control text-journal-control-ink"
              : "text-journal-slate hover:bg-journal-surface dark:hover:bg-white/10"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function PlotSliderControl({
  label,
  min,
  max,
  value,
  onChange,
  suffix = ""
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
}) {
  const bounded = Math.min(Math.max(value, min), max);
  const percent = ((bounded - min) / Math.max(max - min, 1)) * 100;

  return (
    <label className="grid w-[180px] gap-1 rounded-2xl bg-white/90 px-3 py-2 shadow-hairline backdrop-blur-xl dark:bg-[#1c1e24]/90">
      <span className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase text-journal-muted">
        {label}
        <span className="rounded-full bg-journal-control px-2 py-0.5 text-journal-control-ink">
          {bounded}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={bounded}
        onChange={(event) => onChange(Number(event.target.value))}
        className="material-slider"
        style={{ "--slider-fill": `${percent}%` } as React.CSSProperties}
      />
    </label>
  );
}

function MetricNarrativeGrid({ children }: { children: React.ReactNode }) {
  return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</section>;
}

function DeltaNumber({
  label,
  value,
  previous,
  digits = 0
}: {
  label: string;
  value: number;
  previous?: number;
  digits?: number;
}) {
  const delta = previous === undefined ? 0 : value - previous;
  const percent = previous ? (delta / previous) * 100 : 0;
  const positive = delta >= 0;

  return (
    <div className="border-l-2 border-journal-line pl-4">
      <p className="metadata-label">{label}</p>
      <p className="mt-2 text-4xl font-semibold text-journal-ink">{formatMetricValue(value, digits)}</p>
      <p className={`mt-1 text-sm font-semibold ${positive ? "text-teal-600 dark:text-teal-200" : "text-red-600 dark:text-red-200"}`}>
        {positive ? "+" : ""}
        {formatMetricValue(delta, digits)} ({positive ? "+" : ""}
        {formatOneDecimal(percent)}%)
      </p>
    </div>
  );
}

function MetricStrip({ items }: { items: { label: string; value: number }[] }) {
  return (
    <div className="grid gap-x-5 gap-y-3 border-y border-journal-line py-4 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <div key={item.label}>
          <p className="metadata-label">{item.label}</p>
          <p className="mt-1 text-2xl font-semibold text-journal-ink">{formatOneDecimal(item.value)}</p>
        </div>
      ))}
    </div>
  );
}

function EvidenceList({ title, articles }: { title: string; articles: Article[] }) {
  return (
    <section>
      <h3 className="text-lg font-semibold text-journal-ink">{title}</h3>
      <div className="mt-3 space-y-3">
        {articles.slice(0, 10).map((article) => (
          <ArticleSummary key={article.id} article={article} />
        ))}
      </div>
      <FullListLink articles={articles} label="Open full list in Article Explorer" />
    </section>
  );
}

function ArticleEvidenceStack({
  rows,
  metric
}: {
  rows: PerformanceRow[];
  metric: HorizonMetric;
}) {
  return (
    <div className="mt-4 divide-y divide-journal-line">
      {rows.slice(0, 10).map((row, index) => (
        <div key={row.article.id} className={`grid gap-3 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_100px] ${quantileClass(index, rows.length)}`}>
          <ArticleSummary article={row.article} />
          <div className="text-right">
            <p className="metadata-label">{labelForHorizon(metric)}</p>
            <p className="text-lg font-semibold tabular-nums text-journal-ink">{formatOneDecimal(row.value)}</p>
          </div>
        </div>
      ))}
      <FullListLink articles={rows.map((row) => row.article)} label="Open full ranked list in Article Explorer" />
    </div>
  );
}

function TimingList({
  title,
  rows,
  mode
}: {
  title: string;
  rows: TimingRow[];
  mode: "early" | "intermediate" | "late";
}) {
  return (
    <section>
      <h3 className="text-lg font-semibold text-journal-ink">{title}</h3>
      <div className="mt-3 space-y-3">
        {rows.map((row) => (
          <div key={row.article.id} className="grid gap-2 border-b border-journal-line pb-3 sm:grid-cols-[minmax(0,1fr)_70px]">
            <ArticleSummary article={row.article} />
            <p className="text-right text-sm font-semibold tabular-nums text-journal-ink">
              {formatPct(row[mode])}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ArticleSummary({ article }: { article: Article }) {
  return (
    <div>
      <ArticleTitleLink id={article.id} title={article.title} />
      <p className="mt-1 text-xs leading-5 text-journal-muted">
        {article.publicationYear} · {article.articleCategory} · {article.authors[0]?.name ?? "Unknown author"}
      </p>
    </div>
  );
}

function ViewportOverlay({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? createPortal(children, document.body) : null;
}

function JournalPageSideNavigation({
  page,
  setPage
}: {
  page: ReportPage;
  setPage: (value: ReportPage) => void;
}) {
  const currentIndex = reportPages.indexOf(page);
  const previous = reportPages[(currentIndex - 1 + reportPages.length) % reportPages.length];
  const next = reportPages[(currentIndex + 1) % reportPages.length];

  return (
    <>
      <button
        type="button"
        onClick={() => setPage(previous)}
        aria-label={`Open ${pageLabels[previous]}`}
        className="group fixed left-3 top-[50svh] z-[1050] flex -translate-y-1/2 items-center gap-2 rounded-full bg-[color:var(--card-bg)] px-3 py-2 text-sm font-semibold text-journal-ink shadow-[0_12px_36px_rgba(60,64,67,0.18)] ring-1 ring-journal-line/70 backdrop-blur-2xl transition duration-300 ease-[cubic-bezier(0.2,1.35,0.25,1)] hover:-translate-x-1 hover:scale-[1.03] hover:bg-journal-control hover:text-journal-control-ink"
      >
        <ArrowIcon direction="left" />
        <span className="hidden max-w-[9rem] truncate sm:inline">{pageLabels[previous]}</span>
      </button>
      <button
        type="button"
        onClick={() => setPage(next)}
        aria-label={`Open ${pageLabels[next]}`}
        className="group fixed right-3 top-[50svh] z-[1050] flex -translate-y-1/2 items-center gap-2 rounded-full bg-[color:var(--card-bg)] px-3 py-2 text-sm font-semibold text-journal-ink shadow-[0_12px_36px_rgba(60,64,67,0.18)] ring-1 ring-journal-line/70 backdrop-blur-2xl transition duration-300 ease-[cubic-bezier(0.2,1.35,0.25,1)] hover:translate-x-1 hover:scale-[1.03] hover:bg-journal-control hover:text-journal-control-ink"
      >
        <span className="hidden max-w-[9rem] truncate sm:inline">{pageLabels[next]}</span>
        <ArrowIcon direction="right" />
      </button>
    </>
  );
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      {direction === "left" ? <path d="M15 6 9 12l6 6" /> : <path d="m9 6 6 6-6 6" />}
    </svg>
  );
}

function FullListLink({ articles, label }: { articles: Article[]; label: string }) {
  if (articles.length <= 10) {
    return null;
  }

  return (
    <Link
      href={articleExplorerHref(articles)}
      className="mt-4 inline-flex items-center gap-2 rounded-full bg-journal-control px-4 py-2 text-sm font-semibold text-journal-control-ink shadow-[0_8px_20px_rgba(60,64,67,0.16)] transition hover:-translate-y-0.5"
    >
      <ExpandIcon />
      {label}
    </Link>
  );
}

function JournalReportToolbar({
  page,
  setWorkspacePage,
  citationDataset,
  setCitationDataset,
  snapshot,
  setSnapshot,
  journal,
  setJournal,
  jifYear,
  setJifYear,
  jifYears,
  categories,
  category,
  setCategory,
  publicationYears,
  publicationYear,
  setPublicationYear,
  horizonMetric,
  setHorizonMetric,
  sortMode,
  setSortMode
}: {
  page: ReportPage;
  setWorkspacePage: (value: "temporal" | "journal") => void;
  citationDataset: CitationDataset;
  setCitationDataset: (value: CitationDataset) => void;
  snapshot: DatasetSnapshot;
  setSnapshot: (value: DatasetSnapshot) => void;
  journal: Journal;
  setJournal: (value: Journal) => void;
  jifYear: number;
  setJifYear: (value: number) => void;
  jifYears: number[];
  categories: ArticleCategory[];
  category: ArticleCategory;
  setCategory: (value: ArticleCategory) => void;
  publicationYears: number[];
  publicationYear: number;
  setPublicationYear: (value: number) => void;
  horizonMetric: HorizonMetric;
  setHorizonMetric: (value: HorizonMetric) => void;
  sortMode: SortMode;
  setSortMode: (value: SortMode) => void;
}) {
  const minJifYear = Math.min(...jifYears, 2010);
  const maxJifYear = Math.max(...jifYears, 2024);
  const minPublicationYear = Math.min(...publicationYears, 2008);
  const maxPublicationYear = Math.max(...publicationYears, 2022);
  const activeMetricLabel = labelForHorizon(horizonMetric);
  const pageSummary =
    page === "metrics"
      ? `JIF ${jifYear}`
      : page === "performance"
        ? `${shortCategoryLabel(category)}, ${publicationYear}; ${activeMetricLabel}; ${sortMode}`
        : `${shortCategoryLabel(category)}, ${publicationYear}`;

  return (
    <div className="group fixed inset-x-3 bottom-4 z-[1100] mx-auto max-w-6xl rounded-[30px] bg-[color:var(--card-bg)] p-2 shadow-[0_18px_60px_rgba(60,64,67,0.24)] ring-1 ring-journal-line/70 backdrop-blur-2xl transition-[border-radius,transform] duration-500 ease-[cubic-bezier(0.18,1.18,0.28,1)] hover:rounded-[24px] hover:-translate-y-1">
      <div className="flex min-h-12 items-center gap-3 overflow-hidden px-3 py-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-journal-control text-sm font-semibold text-journal-control-ink">
          JP
        </span>
        <div className="min-w-0 flex-1">
          <p className="metadata-label">Toolbar summary</p>
          <p className="truncate text-sm font-semibold text-journal-ink">
            {pageLabels[page]} · {shortJournalLabel(journal)} · {citationDataset} · {snapshot} · {pageSummary}
          </p>
        </div>
        <span className="hidden shrink-0 rounded-full bg-journal-surface/90 px-3 py-1 text-xs font-semibold text-journal-slate shadow-hairline dark:bg-white/8 sm:inline-flex">
          Hover to adjust
        </span>
      </div>

      <div className="pointer-events-none grid grid-rows-[0fr] overflow-hidden opacity-0 transition-[grid-template-rows,opacity,margin] duration-500 ease-[cubic-bezier(0.18,1.18,0.28,1)] group-hover:pointer-events-auto group-hover:mt-2 group-hover:grid-rows-[1fr] group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:mt-2 group-focus-within:grid-rows-[1fr] group-focus-within:opacity-100">
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-journal-line/70 pt-3">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <ToolbarSegmented
                label="Report"
                value="journal"
                options={[
                  { value: "temporal", label: "Temporal" },
                  { value: "journal", label: "Journal" }
                ]}
                onChange={setWorkspacePage}
              />
              <ToolbarSegmented
                label="Source"
                value={citationDataset}
                options={CITATION_DATASETS.map((item) => ({ value: item, label: item }))}
                onChange={setCitationDataset}
              />
              <ToolbarSegmented
                label="Snapshot"
                value={snapshot}
                options={DATASET_SNAPSHOTS.map((item) => ({ value: item, label: item }))}
                onChange={setSnapshot}
              />
              <ToolbarSegmented
                label="Journal"
                value={journal}
                options={JOURNALS.map((item) => ({ value: item, label: shortJournalLabel(item) }))}
                onChange={setJournal}
              />
            </div>

            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {page === "metrics" ? (
                <MaterialSlider label="JIF year" min={minJifYear} max={maxJifYear} value={jifYear} onChange={setJifYear} />
              ) : null}
              {page === "performance" ? (
                <>
                  <ToolbarSegmented
                    label="Category"
                    value={category}
                    options={categories.map((item) => ({ value: item, label: shortCategoryLabel(item) }))}
                    onChange={setCategory}
                  />
                  <MaterialSlider label="Year" min={minPublicationYear} max={maxPublicationYear} value={publicationYear} onChange={setPublicationYear} />
                  <ToolbarSegmented label="Metric" value={horizonMetric} options={horizonOptions.map((item) => ({ value: item.id, label: item.id }))} onChange={setHorizonMetric} />
                  <ToolbarSegmented label="Rank" value={sortMode} options={[{ value: "top", label: "Top" }, { value: "bottom", label: "Bottom" }]} onChange={setSortMode} />
                </>
              ) : null}
              {page === "age" ? (
                <>
                  <ToolbarSegmented
                    label="Category"
                    value={category}
                    options={categories.map((item) => ({ value: item, label: shortCategoryLabel(item) }))}
                    onChange={setCategory}
                  />
                  <MaterialSlider label="Year" min={minPublicationYear} max={maxPublicationYear} value={publicationYear} onChange={setPublicationYear} />
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarSegmented<T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1 rounded-2xl bg-journal-surface/90 p-1 shadow-hairline dark:bg-white/8">
      <span className="px-2 text-[10px] font-semibold uppercase text-journal-muted">{label}</span>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
            value === option.value
              ? "bg-journal-control text-journal-control-ink"
              : "text-journal-slate hover:bg-white/80 dark:hover:bg-white/10"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function MaterialSlider({
  label,
  min,
  max,
  value,
  onChange
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const bounded = Math.min(Math.max(value, min), max);
  const percent = ((bounded - min) / Math.max(max - min, 1)) * 100;

  return (
    <label className="grid min-w-0 gap-1 rounded-2xl bg-white/62 px-3 py-2 shadow-hairline dark:bg-white/8">
      <span className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase text-journal-muted">
        {label}
        <span className="rounded-full bg-journal-control px-2 py-0.5 text-journal-control-ink">
          {bounded}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={bounded}
        onChange={(event) => onChange(Number(event.target.value))}
        className="material-slider"
        style={{ "--slider-fill": `${percent}%` } as React.CSSProperties}
      />
    </label>
  );
}

function ExpandIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3H3v5" />
      <path d="M16 3h5v5" />
      <path d="M21 16v5h-5" />
      <path d="M3 16v5h5" />
    </svg>
  );
}

type JifYearRow = ReturnType<typeof makeJifYearRow>;
type ContributionRow = { article: Article; citations: number; proportion: number };
type PerformanceRow = { article: Article; value: number; fitness: number };
type HistogramBin = { label: string; min: number; max: number; count: number; articleIds: string[] };
type TrajectoryRow = { age: number; temporal: number; cumulative: number; articleIds: string[] };
type CitationLink = { target: Article; citing: Article; ageMonths: number };
type AgeBin = { label: string; min: number; max: number; count: number; articleIds: string[] };
type TimingRow = ReturnType<typeof makeTimingRow>;

function makeJifYearRow(
  articles: Article[],
  journal: Journal,
  year: number,
  dataset: CitationDataset
) {
  const citableItems = jifCitableItems(articles, journal, year);
  const nonCitableItems = articles.filter(
    (article) =>
      article.journal === journal &&
      !isCitableItem(article) &&
      (article.publicationYear === year - 1 || article.publicationYear === year - 2)
  );
  const numerator = citableItems.reduce(
    (sum, article) => sum + jifArticleContribution(article, dataset, year),
    0
  );
  const fiveYearItems = articles.filter(
    (article) =>
      article.journal === journal &&
      isCitableItem(article) &&
      article.publicationYear >= year - 5 &&
      article.publicationYear <= year - 1
  );
  const fiveYearNumerator = fiveYearItems.reduce(
    (sum, article) => sum + jifArticleContribution(article, dataset, year),
    0
  );
  const meanFitness = mean(
    citableItems.map((article) => article.datasetIndexing[dataset].fitness ?? article.fitness)
  );
  const breadth = new Set(
    articles
      .filter((candidate) =>
        candidate.referenceArticleIds.some((id) => citableItems.some((item) => item.id === id))
      )
      .map((candidate) => candidate.journal)
  ).size;

  return {
    year,
    numerator,
    denominator: citableItems.length,
    jif: citableItems.length > 0 ? numerator / citableItems.length : 0,
    fiveYearJif: fiveYearItems.length > 0 ? fiveYearNumerator / fiveYearItems.length : 0,
    sjr: citableItems.length > 0 ? (numerator / citableItems.length) * (0.62 + breadth / 12) : 0,
    snip: meanFitness > 0 && citableItems.length > 0 ? numerator / citableItems.length / meanFitness : 0,
    citableItems,
    nonCitableItems
  };
}

function valueForHorizon(article: Article, dataset: CitationDataset, metric: HorizonMetric) {
  if (metric === "fitness") {
    return article.datasetIndexing[dataset].fitness ?? article.fitness;
  }

  const months = Number(metric.replace(/[my]/g, "")) * (metric.endsWith("y") ? 12 : 1);
  return citationsWithinMonths(article, dataset, months);
}

function jifArticleContribution(article: Article, dataset: CitationDataset, year: number) {
  const annualCitations = citationCountInYear(article, dataset, year);
  const categoryWeight = article.articleCategory === "Guideline / Statement / Statistics"
    ? 1.2
    : article.articleCategory === "Review" || article.articleCategory === "Meta-analysis"
      ? 1.08
      : 1;

  return Math.max(0, Math.round(Math.log1p(annualCitations) * 2.7 * categoryWeight));
}

function citationsWithinMonths(article: Article, dataset: CitationDataset, months: number) {
  const years = months / 12;
  return article.citationTrajectories[dataset].reduce((sum, point) => {
    const ageStart = point.year - article.publicationYear;
    const ageEnd = ageStart + 1;
    if (years >= ageEnd) {
      return sum + point.citations;
    }
    if (years > ageStart) {
      return sum + point.citations * (years - ageStart);
    }
    return sum;
  }, 0);
}

function makeHistogram(
  rows: PerformanceRow[],
  binCount: number,
  minOverride?: number,
  maxOverride?: number
): HistogramBin[] {
  if (rows.length === 0) {
    return [{ label: "No data", min: 0, max: 1, count: 0, articleIds: [] }];
  }

  const values = rows.map((row) => row.value);
  const min = minOverride ?? Math.min(...values);
  const max = maxOverride ?? Math.max(...values);
  const step = Math.max((max - min) / binCount, 1);

  return Array.from({ length: binCount }, (_, index) => {
    const binMin = min + step * index;
    const binMax = index === binCount - 1 ? max : binMin + step;
    const articles = rows.filter((row) =>
      index === binCount - 1
        ? row.value >= binMin && row.value <= binMax
        : row.value >= binMin && row.value < binMax
    );
    return {
      label: `${formatCompact(binMin)}-${formatCompact(binMax)}`,
      min: binMin,
      max: binMax,
      count: articles.length,
      articleIds: articles.map((row) => row.article.id)
    };
  });
}

function makeAverageTrajectory(articles: Article[], dataset: CitationDataset): TrajectoryRow[] {
  const maxAge = Math.min(
    10,
    Math.max(
      0,
      ...articles.flatMap((article) =>
        article.citationTrajectories[dataset].map((point) => point.year - article.publicationYear)
      )
    )
  );

  return Array.from({ length: maxAge + 1 }, (_, age) => ({
    age,
    temporal: mean(
      articles.map(
        (article) =>
          article.citationTrajectories[dataset].find(
            (point) => point.year - article.publicationYear === age
          )?.citations ?? 0
      )
    ),
    cumulative: mean(
      articles.map((article) =>
        article.citationTrajectories[dataset]
          .filter((point) => point.year - article.publicationYear <= age)
          .reduce((sum, point) => sum + point.citations, 0)
      )
    ),
    articleIds: articles.map((article) => article.id)
  }));
}

function makeTimingRow(article: Article, dataset: CitationDataset) {
  const total =
    article.citationTrajectories[dataset].reduce((sum, point) => sum + point.citations, 0) || 1;
  const sixMonth = citationsWithinMonths(article, dataset, 6);
  const twoYear = citationsWithinMonths(article, dataset, 24);
  const fiveYear = citationsWithinMonths(article, dataset, 60);

  return {
    article,
    early: (sixMonth / total) * 100,
    intermediate: (Math.max(twoYear - sixMonth, 0) / total) * 100,
    late: (Math.max(fiveYear - twoYear, 0) / total) * 100
  };
}

function makeCitationLinks(articles: Article[], targets: Article[]) {
  const targetById = new Map(targets.map((article) => [article.id, article]));
  const links: CitationLink[] = [];

  articles.forEach((citing) => {
    citing.referenceArticleIds.forEach((id) => {
      const target = targetById.get(id);
      if (target) {
        links.push({
          target,
          citing,
          ageMonths: monthsBetween(target.publicationDate, citing.publicationDate)
        });
      }
    });
  });

  return links;
}

function makeAgeBins(
  links: CitationLink[],
  granularity: TimeGranularity,
  binSize: number,
  min = 0
): AgeBin[] {
  const binMonths = binSizeToMonths(binSize, granularity);
  const max = Math.max(120, ...links.map((link) => link.ageMonths), binMonths);
  const count = Math.max(1, Math.ceil((max - min) / binMonths));
  return Array.from({ length: count }, (_, index) => {
    const binMin = min + index * binMonths;
    const binMax = binMin + binMonths;
    const binLinks = links.filter((link) => link.ageMonths >= binMin && link.ageMonths < binMax);
    return {
      label: formatAgeBinLabel(binMin, binMax, granularity),
      min: binMin,
      max: binMax,
      count: binLinks.length,
      articleIds: Array.from(new Set(binLinks.map((link) => link.target.id)))
    };
  });
}

function defaultBinSize(granularity: TimeGranularity) {
  if (granularity === "year") return 1;
  if (granularity === "day") return 90;
  return 12;
}

function binSizeRange(granularity: TimeGranularity) {
  if (granularity === "year") return { min: 1, max: 10 };
  if (granularity === "day") return { min: 30, max: 730 };
  return { min: 1, max: 60 };
}

function binSizeToMonths(binSize: number, granularity: TimeGranularity) {
  if (granularity === "year") return binSize * 12;
  if (granularity === "day") return binSize / 30.44;
  return binSize;
}

function formatAgeBinLabel(minMonths: number, maxMonths: number, granularity: TimeGranularity) {
  if (granularity === "year") {
    return `${formatCompact(minMonths / 12)}-${formatCompact(maxMonths / 12)}y`;
  }
  if (granularity === "day") {
    return `${formatInteger(Math.round(minMonths * 30.44))}-${formatInteger(Math.round(maxMonths * 30.44))}d`;
  }
  return `${formatCompact(minMonths)}-${formatCompact(maxMonths)}m`;
}

function axisZoomData(includeY = true) {
  const xZoom = [
    {
      type: "inside" as const,
      xAxisIndex: 0,
      filterMode: "none" as const,
      moveOnMouseMove: true,
      moveOnMouseWheel: true
    },
    {
      type: "slider" as const,
      xAxisIndex: 0,
      filterMode: "none" as const,
      height: 18,
      bottom: 16,
      borderColor: "transparent",
      backgroundColor: "rgba(95, 99, 104, 0.10)",
      fillerColor: "rgba(26, 115, 232, 0.18)",
      handleStyle: { color: "#1A73E8" },
      dataBackground: {
        lineStyle: { color: "rgba(26, 115, 232, 0.30)" },
        areaStyle: { color: "rgba(26, 115, 232, 0.08)" }
      }
    }
  ];

  const yZoom = [
    {
      type: "inside" as const,
      yAxisIndex: 0,
      filterMode: "none" as const,
      moveOnMouseMove: true,
      moveOnMouseWheel: true
    },
    {
      type: "slider" as const,
      yAxisIndex: 0,
      filterMode: "none" as const,
      width: 14,
      right: 8,
      borderColor: "transparent",
      backgroundColor: "rgba(95, 99, 104, 0.10)",
      fillerColor: "rgba(26, 115, 232, 0.16)",
      handleStyle: { color: "#1A73E8" }
    }
  ];

  return includeY ? [...xZoom, ...yZoom] : xZoom;
}

function metricTrendOption(rows: JifYearRow[], granularity: TimeGranularity): EChartsOption {
  return {
    tooltip: { show: false },
    legend: { top: 0 },
    grid: { left: 52, right: 58, top: 48, bottom: 68 },
    xAxis: { type: "category", data: rows.map((row) => formatMetricPeriod(row.year, granularity)) },
    yAxis: { type: "value" },
    dataZoom: axisZoomData(),
    series: [
      seriesLine("JIF", rows, (row) => row.jif),
      seriesLine("5-year JIF", rows, (row) => row.fiveYearJif),
      seriesLine("SJR", rows, (row) => row.sjr),
      seriesLine("SNIP", rows, (row) => row.snip)
    ]
  };
}

function seriesLine(name: string, rows: JifYearRow[], accessor: (row: JifYearRow) => number) {
  return {
    name,
    type: "line" as const,
    smooth: true,
    data: rows.map((row) => ({
      value: round(accessor(row)),
      articleIds: row.citableItems.map((article) => article.id)
    }))
  };
}

function topContributionOption(rows: ContributionRow[]): EChartsOption {
  return {
    tooltip: { show: false },
    grid: { left: 104, right: 58, top: 12, bottom: 58 },
    xAxis: { type: "value" },
    yAxis: { type: "category", data: rows.map((row) => row.article.id), inverse: true },
    dataZoom: axisZoomData(),
    series: [
      {
        type: "bar",
        color: "#1A73E8",
        data: rows.map((row) => ({
          value: row.citations,
          articleIds: [row.article.id]
        }))
      }
    ]
  };
}

function histogramOption(bins: HistogramBin[], metric: HorizonMetric): EChartsOption {
  return {
    tooltip: { show: false },
    grid: { left: 48, right: 58, top: 16, bottom: 78 },
    xAxis: { type: "category", data: bins.map((bin) => bin.label), axisLabel: { rotate: 25 } },
    yAxis: { type: "value" },
    dataZoom: axisZoomData(),
    series: [
      {
        name: labelForHorizon(metric),
        type: "bar",
        color: metric === "fitness" ? "#12A182" : "#1A73E8",
        data: bins.map((bin) => ({ value: bin.count, articleIds: bin.articleIds }))
      }
    ]
  };
}

function trajectoryOption(rows: TrajectoryRow[], granularity: TimeGranularity): EChartsOption {
  const chartRows = resampleTrajectoryRows(rows, granularity);
  return {
    tooltip: { show: false },
    legend: { top: 0 },
    grid: { left: 50, right: 58, top: 48, bottom: 68 },
    xAxis: { type: "category", data: chartRows.map((row) => row.label) },
    yAxis: { type: "value" },
    dataZoom: axisZoomData(),
    series: [
      {
        name: "Temporal",
        type: "line",
        smooth: true,
        data: chartRows.map((row) => ({ value: round(row.temporal), articleIds: row.articleIds }))
      },
      {
        name: "Cumulative",
        type: "line",
        smooth: true,
        data: chartRows.map((row) => ({ value: round(row.cumulative), articleIds: row.articleIds }))
      }
    ]
  };
}

function ageHistogramOption(bins: AgeBin[]): EChartsOption {
  return {
    tooltip: { show: false },
    grid: { left: 48, right: 58, top: 16, bottom: 78 },
    xAxis: { type: "category", data: bins.map((bin) => bin.label), axisLabel: { rotate: 25 } },
    yAxis: { type: "value" },
    dataZoom: axisZoomData(),
    series: [
      {
        type: "bar",
        color: "#F9AB00",
        data: bins.map((bin) => ({ value: bin.count, articleIds: bin.articleIds }))
      }
    ]
  };
}

function compositionOption(data: { label: string; value: number; articleIds: string[] }[]): EChartsOption {
  return {
    tooltip: { show: false },
    series: [
      {
        type: "pie",
        radius: ["42%", "72%"],
        data: data.map((item) => ({
          name: item.label,
          value: item.value,
          articleIds: item.articleIds,
          itemStyle: { color: categoryPalette[item.label] }
        }))
      }
    ]
  };
}

function barCountOption(data: { label: string; value: number; articleIds: string[] }[]): EChartsOption {
  return {
    tooltip: { show: false },
    grid: { left: 48, right: 58, top: 16, bottom: 82 },
    xAxis: { type: "category", data: data.map((item) => item.label), axisLabel: { rotate: 35 } },
    yAxis: { type: "value" },
    dataZoom: axisZoomData(),
    series: [
      {
        type: "bar",
        color: "#7C4DFF",
        data: data.map((item) => ({ value: item.value, articleIds: item.articleIds }))
      }
    ]
  };
}

function countBy<T extends CitationLink>(items: T[], accessor: (item: T) => string) {
  const groups = new Map<string, T[]>();
  items.forEach((item) => {
    const key = accessor(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });
  return Array.from(groups.entries())
    .map(([label, rows]) => ({
      label,
      value: rows.length,
      articleIds: Array.from(new Set(rows.map((row) => row.target.id)))
    }))
    .sort((a, b) => b.value - a.value);
}

function countByPublicationDate(items: CitationLink[], granularity: TimeGranularity) {
  const groups = new Map<string, CitationLink[]>();
  items.forEach((item) => {
    const key = publicationPeriodKey(item.citing.publicationDate, granularity);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });
  return Array.from(groups.entries())
    .map(([label, rows]) => ({
      label,
      value: rows.length,
      articleIds: Array.from(new Set(rows.map((row) => row.target.id)))
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function publicationPeriodKey(dateValue: string, granularity: TimeGranularity) {
  const [year, month, day] = dateValue.split("-");
  if (granularity === "day") {
    return `${year}-${month}-${day}`;
  }
  if (granularity === "month") {
    return `${year}-${month}`;
  }
  return year;
}

function metricValueForRow(row: PerformanceRow, metric: HorizonMetric) {
  return metric === "fitness" ? row.fitness : row.value;
}

function formatMetricPeriod(year: number, granularity: TimeGranularity) {
  if (granularity === "day") {
    return `${year}-12-31`;
  }
  if (granularity === "month") {
    return `${year}-12`;
  }
  return String(year);
}

function resampleTrajectoryRows(rows: TrajectoryRow[], granularity: TimeGranularity) {
  if (rows.length === 0) {
    return [{ label: "0", temporal: 0, cumulative: 0, articleIds: [] as string[] }];
  }

  const unit = granularity === "year" ? 1 : granularity === "month" ? 12 : 365;
  const maxAge = Math.max(...rows.map((row) => row.age));
  const maxStep = Math.max(0, Math.round(maxAge * unit));
  const rowByAge = new Map(rows.map((row) => [row.age, row]));
  const articleIds = rows[0]?.articleIds ?? [];

  return Array.from({ length: maxStep + 1 }, (_, step) => {
    const age = step / unit;
    const lowerAge = Math.floor(age);
    const upperAge = Math.ceil(age);
    const lower = rowByAge.get(lowerAge) ?? rows[0];
    const upper = rowByAge.get(upperAge) ?? rows[rows.length - 1];
    const fraction = upperAge === lowerAge ? 0 : age - lowerAge;
    return {
      label: trajectoryLabel(step, granularity),
      temporal: interpolate(lower.temporal, upper.temporal, fraction) / unit,
      cumulative: interpolate(lower.cumulative, upper.cumulative, fraction),
      articleIds
    };
  });
}

function trajectoryLabel(step: number, granularity: TimeGranularity) {
  if (granularity === "day") return `D${step}`;
  if (granularity === "month") return `M${step}`;
  return `Y${step}`;
}

function interpolate(start: number, end: number, fraction: number) {
  return start + (end - start) * fraction;
}

function articleExplorerHref(articles: Article[]) {
  const params = new URLSearchParams();

  articles.slice(0, 250).forEach((article) => params.append("ids", article.id));
  params.append("order", "totalCitations:desc");

  return `/articles?${params.toString()}`;
}

function monthsBetween(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  return Math.max(0, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
}

function mean(values: number[]) {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function quantileClass(index: number, total: number) {
  if (total <= 0) {
    return quantileClasses[4];
  }
  const percentile = (index + 1) / total;
  if (percentile <= 0.1) return quantileClasses[0];
  if (percentile <= 0.25) return quantileClasses[1];
  if (percentile <= 0.5) return quantileClasses[2];
  if (percentile <= 0.75) return quantileClasses[3];
  return quantileClasses[4];
}

function labelForHorizon(metric: HorizonMetric) {
  return horizonOptions.find((option) => option.id === metric)?.label ?? metric;
}

function shortJournalLabel(journal: Journal) {
  if (journal === "Journal of the American College of Cardiology") {
    return "JACC";
  }
  if (journal === "European Heart Journal") {
    return "EHJ";
  }
  if (journal === "JAMA Cardiology") {
    return "JAMA";
  }
  return "CIRC";
}

function shortCategoryLabel(category: ArticleCategory) {
  if (category === "Guideline / Statement / Statistics") {
    return "G/S/S";
  }
  if (category === "Other Non-original") {
    return "Other";
  }
  if (category === "Original Research") {
    return "Original";
  }
  return category;
}

function formatPct(value: number) {
  return `${formatOneDecimal(value)}%`;
}

function formatCompact(value: number) {
  return value >= 100 ? formatInteger(Math.round(value)) : formatOneDecimal(value);
}

function formatMetricValue(value: number, digits: number) {
  return digits > 0 ? value.toFixed(digits) : formatInteger(Math.round(value));
}

function round(value: number) {
  return Number(value.toFixed(2));
}
