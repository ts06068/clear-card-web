"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ResultsAtlas } from "@/components/charts/ResultsAtlas";
import { CITATION_DATASETS, DATASET_SNAPSHOTS } from "@/types/bibliometric";
import type { Article, CitationDataset, DatasetSnapshot } from "@/types/bibliometric";
import type { ResearchResultsDataset } from "@/types/researchResults";
import { JournalPerformance } from "./JournalPerformance";

const reportPages = [
  {
    id: "temporal",
    label: "Temporal Impact Comparison",
    helper: "Main, supplemental, and customized CLEAR-CARD views"
  },
  {
    id: "journal",
    label: "Journal Performance",
    helper: "JIF-style numerator, denominator, trajectories, and citation network diagnostics"
  }
] as const;

export function ReportsWorkspace({
  dataset,
  articles
}: {
  dataset: ResearchResultsDataset;
  articles: Article[];
}) {
  const [activePage, setActivePage] = useState<(typeof reportPages)[number]["id"]>("temporal");
  const [citationDataset, setCitationDataset] = useState<CitationDataset>("Scopus");
  const [snapshot, setSnapshot] = useState<DatasetSnapshot>(
    DATASET_SNAPSHOTS[DATASET_SNAPSHOTS.length - 1]
  );

  const scopedArticles = useMemo(
    () =>
      articles.filter((article) =>
        article.datasetIndexing[citationDataset].indexedSnapshots.includes(snapshot)
      ),
    [articles, citationDataset, snapshot]
  );

  const articleDistributions = useMemo(
    () =>
      scopedArticles.map((article) => ({
        id: article.id,
        title: article.title,
        journal: article.journal,
        publicationDate: article.publicationDate,
        publicationYear: article.publicationYear,
        articleType: article.articleType,
        articleCategory: article.articleCategory,
        classification: article.classification,
        totalCitationCount:
          article.datasetIndexing[citationDataset].totalCitationCount ??
          article.totalCitationCount,
        twoYearCitationCount:
          article.datasetIndexing[citationDataset].twoYearCitationCount ??
          article.twoYearCitationCount,
        fitness: article.datasetIndexing[citationDataset].fitness ?? article.fitness
      })),
    [citationDataset, scopedArticles]
  );

  return (
    <section className="mx-auto max-w-[1800px] pb-36">
      <div key={activePage} className="animate-report-page">
        {activePage === "temporal" ? (
          <ResultsAtlas dataset={dataset} articleDistributions={articleDistributions} />
        ) : (
          <JournalPerformance
            articles={scopedArticles}
            citationDataset={citationDataset}
            setCitationDataset={setCitationDataset}
            snapshot={snapshot}
            setSnapshot={setSnapshot}
            setWorkspacePage={setActivePage}
          />
        )}
      </div>

      {activePage === "temporal" ? (
        <ReportBottomToolbar
          activePage={activePage}
          setActivePage={setActivePage}
          citationDataset={citationDataset}
          setCitationDataset={setCitationDataset}
          snapshot={snapshot}
          setSnapshot={setSnapshot}
        />
      ) : null}
    </section>
  );
}

function ReportBottomToolbar({
  activePage,
  setActivePage,
  citationDataset,
  setCitationDataset,
  snapshot,
  setSnapshot
}: {
  activePage: (typeof reportPages)[number]["id"];
  setActivePage: (value: (typeof reportPages)[number]["id"]) => void;
  citationDataset: CitationDataset;
  setCitationDataset: (value: CitationDataset) => void;
  snapshot: DatasetSnapshot;
  setSnapshot: (value: DatasetSnapshot) => void;
}) {
  const activeReport = reportPages.find((page) => page.id === activePage) ?? reportPages[0];

  return (
    <ViewportOverlay>
      <div className="group fixed inset-x-3 bottom-4 z-[1100] mx-auto max-w-5xl rounded-[30px] bg-[color:var(--card-bg)] p-2 shadow-[0_18px_60px_rgba(60,64,67,0.24)] ring-1 ring-journal-line/70 backdrop-blur-2xl transition-[border-radius,transform] duration-500 ease-[cubic-bezier(0.18,1.18,0.28,1)] hover:rounded-[24px] hover:-translate-y-1">
        <div className="flex min-h-12 items-center gap-3 overflow-hidden px-3 py-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-journal-control text-sm font-semibold text-journal-control-ink">
            R
          </span>
          <div className="min-w-0 flex-1">
            <p className="metadata-label">Toolbar summary</p>
            <p className="truncate text-sm font-semibold text-journal-ink">
              {activeReport.label} · {citationDataset} · {snapshot}
            </p>
          </div>
          <span className="hidden shrink-0 rounded-full bg-journal-surface/90 px-3 py-1 text-xs font-semibold text-journal-slate shadow-hairline dark:bg-white/8 sm:inline-flex">
            Hover to adjust
          </span>
        </div>

        <div className="pointer-events-none grid grid-rows-[0fr] overflow-hidden opacity-0 transition-[grid-template-rows,opacity,margin] duration-500 ease-[cubic-bezier(0.18,1.18,0.28,1)] group-hover:pointer-events-auto group-hover:mt-2 group-hover:grid-rows-[1fr] group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:mt-2 group-focus-within:grid-rows-[1fr] group-focus-within:opacity-100">
          <div className="min-h-0 overflow-hidden">
            <div className="grid gap-2 border-t border-journal-line/70 pt-3 sm:grid-cols-2 lg:grid-cols-3">
              <SegmentedControl
                label="Report"
                value={activePage}
                options={reportPages.map((page) => ({
                  value: page.id,
                  label: page.label,
                  title: page.helper
                }))}
                onChange={setActivePage}
              />
              <SegmentedControl
                label="Database"
                value={citationDataset}
                options={CITATION_DATASETS.map((source) => ({ value: source, label: source }))}
                onChange={setCitationDataset}
              />
              <SegmentedControl
                label="Snapshot"
                value={snapshot}
                options={DATASET_SNAPSHOTS.map((item) => ({ value: item, label: item }))}
                onChange={setSnapshot}
              />
            </div>
          </div>
        </div>
      </div>
    </ViewportOverlay>
  );
}

function ViewportOverlay({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? createPortal(children, document.body) : null;
}

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: T;
  options: { value: T; label: string; title?: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1 rounded-2xl bg-journal-surface/90 p-1 shadow-hairline dark:bg-white/8">
      <span className="px-2 text-[10px] font-semibold uppercase text-journal-muted">{label}</span>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          title={option.title}
          onClick={() => onChange(option.value)}
          className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
            value === option.value
              ? "bg-journal-control text-journal-control-ink shadow-[0_8px_20px_rgba(60,64,67,0.16)]"
              : "text-journal-slate hover:bg-white/80 hover:text-journal-ink dark:hover:bg-white/10"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
