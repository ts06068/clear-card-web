"use client";

import { useState } from "react";
import { CITATION_DATASETS } from "@/types/bibliometric";
import type {
  ArticleSourceBenchmark,
  CitationDataset,
  CitationPoint,
  DatasetIndexingStatus
} from "@/types/bibliometric";
import { CitationTrajectoryChart, HistogramChart } from "./charts/BibliometricCharts";
import { MetadataBadge } from "./MetadataBadge";

export function ArticleTrajectoryPanel({
  trajectories,
  benchmarks,
  datasetIndexing
}: {
  trajectories: Record<CitationDataset, CitationPoint[]>;
  benchmarks: Record<CitationDataset, ArticleSourceBenchmark>;
  datasetIndexing: Record<CitationDataset, DatasetIndexingStatus>;
}) {
  const [dataset, setDataset] = useState<CitationDataset>("Scopus");
  const benchmark = benchmarks[dataset];
  const status = datasetIndexing[dataset];

  return (
    <section className="mb-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-journal-line pb-3">
        <div>
          <p className="metadata-label">Citation trajectory source</p>
          <h2 className="text-lg font-semibold text-journal-ink">
            {dataset} trajectory and source-specific quantiles
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <MetadataBadge tone={status.indexed ? "blue" : "neutral"}>
              {status.indexed ? "indexed" : "not indexed"}
            </MetadataBadge>
            <MetadataBadge>{status.originalCategory}</MetadataBadge>
            <MetadataBadge>{status.snapshot}</MetadataBadge>
          </div>
        </div>
        <div className="flex border border-journal-line bg-[color:var(--card-bg)] p-0.5">
          {CITATION_DATASETS.map((source) => (
            <button
              key={source}
              type="button"
              onClick={() => setDataset(source)}
              className={`px-4 py-2 text-sm font-semibold transition ${
                dataset === source
                  ? "bg-journal-navy text-white"
                  : "text-journal-slate hover:bg-journal-surface"
              }`}
            >
              {source}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <CitationTrajectoryChart
          points={trajectories[dataset]}
          benchmark={benchmark.meanTemporal}
        />
        <CitationTrajectoryChart
          points={trajectories[dataset]}
          benchmark={benchmark.meanCumulative}
          cumulative
        />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <HistogramChart
          title={`${dataset} 2-year Citation Quantile`}
          subtitle={benchmark.label}
          bins={benchmark.twoYearCitationHistogram}
          markerValue={benchmark.twoYearCitationValue}
          quantile={benchmark.twoYearCitationQuantile}
        />
        <HistogramChart
          title={`${dataset} Fitness Quantile`}
          subtitle={benchmark.label}
          bins={benchmark.fitnessHistogram}
          markerValue={benchmark.fitnessValue}
          quantile={benchmark.fitnessQuantile}
        />
      </div>
    </section>
  );
}
