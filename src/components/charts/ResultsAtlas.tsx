"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { EChartsOption } from "echarts";
import type {
  MainFigureLegend,
  ResearchCell,
  ResearchResultsDataset,
  ResearchTable,
  ResearchTableRecord
} from "@/types/researchResults";
import { EChart } from "./EChartCard";

type ChartMode = "time" | "heatmap" | "composition" | "association";
type ValueMode = "value" | "secondary";
type TimeGranularity = "year" | "month" | "day";

interface ArticleDistributionDatum {
  id: string;
  title?: string;
  journal: string;
  publicationDate?: string;
  publicationYear: number;
  articleType?: string;
  articleCategory: string;
  classification?: string;
  totalCitationCount?: number;
  twoYearCitationCount: number;
  fitness: number;
}

const journalColors: Record<string, string> = {
  CIRC: "#D93025",
  EHJ: "#12A182",
  JACC: "#1A73E8",
  "JAMA CARDIOL": "#F9AB00"
};

const journalNames: Record<string, string> = {
  CIRC: "Circulation",
  EHJ: "European Heart Journal",
  JACC: "Journal of the American College of Cardiology",
  "JAMA CARDIOL": "JAMA Cardiology"
};

const journalCodesByName = Object.fromEntries(
  Object.entries(journalNames).map(([code, name]) => [name, code])
) as Record<string, string>;

const resultWorkspaces = [
  { id: "metrics", label: "Journal Metrics", tableNumbers: [1, 18] },
  { id: "impact", label: "Citation Impact", tableNumbers: [2, 3, 4, 5] },
  { id: "publication", label: "Publication Mix", tableNumbers: [6, 7] },
  { id: "citations", label: "Citation Share", tableNumbers: [8, 9] },
  { id: "quality", label: "Citation Quality", tableNumbers: [10, 11, 12, 13, 14, 15, 16, 17] }
] as const;

const chartModes: { id: ChartMode; label: string }[] = [
  { id: "time", label: "Trajectory" },
  { id: "heatmap", label: "Heatmap" },
  { id: "composition", label: "Composition" },
  { id: "association", label: "Metric Pairing" }
];

const granularities: { id: TimeGranularity; label: string }[] = [
  { id: "year", label: "Yearly" },
  { id: "month", label: "Monthly" },
  { id: "day", label: "Daily" }
];

type ArticleMetric = "twoYearCitationCount" | "fitness" | "totalCitationCount" | "count";
type PairMetric = ArticleMetric | "JIF";
type ArticlePlotKind = "line" | "bar" | "histogram" | "pairing";
type ArticleXAxis = "publicationDate" | "article" | "journal" | "articleCategory" | "journalCategory";
type ArticleGrouping = "none" | "journal" | "articleCategory" | "classification";
type ArticleStatistic = "mean" | "median" | "count" | "sum" | "se" | "q1q3" | "percentage";
type PercentageDenominator = "all" | "period" | "journal" | "category";
type PairGranularity = "article" | TimeGranularity | "journal" | "articleCategory" | "journalCategory";

const articleMetrics: { id: ArticleMetric; label: string }[] = [
  { id: "twoYearCitationCount", label: "2-year citation count" },
  { id: "fitness", label: "Fitness" },
  { id: "totalCitationCount", label: "Total citation count" },
  { id: "count", label: "Article count" }
];

const pairMetrics: { id: PairMetric; label: string }[] = [
  ...articleMetrics,
  { id: "JIF", label: "JIF" }
];

const articlePlotKinds: { id: ArticlePlotKind; label: string }[] = [
  { id: "line", label: "Trajectory" },
  { id: "bar", label: "Bars" },
  { id: "histogram", label: "Histogram" },
  { id: "pairing", label: "Metric pairing" }
];

const articleAxes: { id: ArticleXAxis; label: string }[] = [
  { id: "publicationDate", label: "Publication date" },
  { id: "article", label: "Each article" },
  { id: "journal", label: "Journal" },
  { id: "articleCategory", label: "Article category" },
  { id: "journalCategory", label: "Journal + category" }
];

const articleGroupings: { id: ArticleGrouping; label: string }[] = [
  { id: "none", label: "No legend" },
  { id: "journal", label: "Journal" },
  { id: "articleCategory", label: "Article category" },
  { id: "classification", label: "ORA/NORA" }
];

const articleStatistics: { id: ArticleStatistic; label: string }[] = [
  { id: "mean", label: "Mean" },
  { id: "median", label: "Median" },
  { id: "count", label: "Count" },
  { id: "sum", label: "Sum" },
  { id: "se", label: "Mean with SE" },
  { id: "q1q3", label: "Median with Q1-Q3" },
  { id: "percentage", label: "Percentage" }
];

const percentageDenominators: { id: PercentageDenominator; label: string }[] = [
  { id: "all", label: "All visible articles" },
  { id: "period", label: "Same x-axis period" },
  { id: "journal", label: "Same journal" },
  { id: "category", label: "Same category" }
];

const pairGranularities: { id: PairGranularity; label: string }[] = [
  { id: "article", label: "Each article" },
  { id: "year", label: "Yearly" },
  { id: "month", label: "Monthly" },
  { id: "day", label: "Daily" },
  { id: "journal", label: "Journal" },
  { id: "articleCategory", label: "Article category" },
  { id: "journalCategory", label: "Journal + category" }
];

function getCellValue(cell: ResearchCell | undefined, mode: ValueMode) {
  if (!cell) {
    return null;
  }

  return mode === "secondary" ? cell.secondaryValue ?? cell.value : cell.value;
}

function uniqueSorted<T extends string | number>(values: T[]) {
  return Array.from(new Set(values)).sort((a, b) =>
    typeof a === "number" && typeof b === "number"
      ? a - b
      : String(a).localeCompare(String(b))
  );
}

function getRecordValue(
  records: ResearchTableRecord[],
  journalCode: string,
  year: number,
  column: string,
  mode: ValueMode
) {
  const record = records.find(
    (candidate) => candidate.journalCode === journalCode && candidate.year === year
  );
  return getCellValue(record?.values[column], mode);
}

function findMetricRecord(
  metricTable: ResearchTable | undefined,
  journalCode: string,
  year: number,
  metric: string
) {
  return metricTable?.records.find(
    (record) => record.journalCode === journalCode && record.year === year
  )?.values[metric]?.value ?? null;
}

function dateString(year: number, month = 1, day = 1) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function yearFromDate(value: string) {
  const parsed = Number(value.slice(0, 4));
  return Number.isFinite(parsed) ? parsed : 2008;
}

function dateWithin(value: string, startDate: string, endDate: string) {
  return value >= startDate && value <= endDate;
}

function expandYearToDates(year: number, granularity: TimeGranularity) {
  if (granularity === "year") {
    return [dateString(year)];
  }

  if (granularity === "month") {
    return Array.from({ length: 12 }, (_, index) => dateString(year, index + 1));
  }

  const dates: string[] = [];
  const cursor = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

function expandedSeriesData({
  records,
  journal,
  column,
  mode,
  granularity,
  startDate,
  endDate
}: {
  records: ResearchTableRecord[];
  journal: string;
  column: string;
  mode: ValueMode;
  granularity: TimeGranularity;
  startDate: string;
  endDate: string;
}) {
  return records
    .filter((record) => record.journalCode === journal)
    .flatMap((record) =>
      expandYearToDates(record.year, granularity).map((date) => ({
        date,
        year: record.year,
        value: getCellValue(record.values[column], mode)
      }))
    )
    .filter((point) => point.value !== null && dateWithin(point.date, startDate, endDate))
    .map((point) => [point.date, point.value, point.year]);
}

function timeLabels(years: number[], granularity: TimeGranularity, startDate: string, endDate: string) {
  return years
    .flatMap((year) => expandYearToDates(year, granularity))
    .filter((date) => dateWithin(date, startDate, endDate));
}

function cleanResultTitle(title: string) {
  return title
    .replace(/^Supplemental Table \d+\.\s*/, "")
    .replace(/^Supplemental Figure \d+\.\s*/, "")
    .replace(/^Figure \d+\.\s*/, "")
    .replace(/^Yearly\s+/i, "");
}

function figureTopic(figure: MainFigureLegend) {
  return cleanResultTitle(figure.title);
}

function topicTarget(title: string) {
  const lower = title.toLowerCase();

  if (lower.includes("publication volume") || lower.includes("publication among")) {
    return { workspaceId: "publication" as const, tableNumber: lower.includes("non-citable") ? 7 : 6 };
  }

  if (lower.includes("2-year citation") && lower.includes("proportion")) {
    return { workspaceId: "citations" as const, tableNumber: lower.includes("non-citable") ? 9 : 8 };
  }

  if (lower.includes("2-year citation")) {
    return { workspaceId: "impact" as const, tableNumber: lower.includes("median") ? 5 : 4 };
  }

  if (lower.includes("fitness")) {
    return { workspaceId: "impact" as const, tableNumber: lower.includes("median") ? 3 : 2 };
  }

  if (lower.includes("h-index")) {
    return { workspaceId: "quality" as const, tableNumber: lower.includes("median") ? 13 : 12 };
  }

  if (lower.includes("sjr")) {
    return { workspaceId: "quality" as const, tableNumber: lower.includes("median") ? 15 : 14 };
  }

  if (lower.includes("snip")) {
    return { workspaceId: "quality" as const, tableNumber: lower.includes("median") ? 17 : 16 };
  }

  if (lower.includes("predatory")) {
    return { workspaceId: "quality" as const, tableNumber: lower.includes("median") ? 11 : 10 };
  }

  return { workspaceId: "metrics" as const, tableNumber: lower.includes("simulation") ? 18 : 1 };
}

function categoryFromMetric(metric: string) {
  if (metric === "ORA") {
    return "Original Research";
  }

  if (metric.includes("Meta-analysis")) {
    return "Meta-analysis";
  }

  if (metric.includes("Review")) {
    return "Review";
  }

  if (metric.includes("GSS")) {
    return "Guideline / Statement / Statistics";
  }

  return undefined;
}

function articleExplorerHref(journalCode: string, year: number, metric: string) {
  const params = new URLSearchParams({
    journal: journalNames[journalCode] ?? journalCode,
    yearFrom: String(year),
    yearTo: String(year)
  });
  const category = categoryFromMetric(metric);

  if (category) {
    params.set("articleCategory", category);
  }

  return `/articles?${params.toString()}`;
}

function mean(values: number[]) {
  return values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

function median(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function quantile(values: number[], percentile: number) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * percentile;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function standardDeviation(values: number[]) {
  if (values.length < 2) {
    return 0;
  }

  const average = mean(values);
  const variance =
    values.reduce((sum, value) => sum + (value - average) ** 2, 0) /
    (values.length - 1);
  return Math.sqrt(variance);
}

function standardError(values: number[]) {
  return values.length > 1 ? standardDeviation(values) / Math.sqrt(values.length) : 0;
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) {
    return "NA";
  }

  return Math.abs(value) >= 100
    ? value.toLocaleString(undefined, { maximumFractionDigits: 0 })
    : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function metricLabel(metric: string) {
  return pairMetrics.find((item) => item.id === metric)?.label ?? metric;
}

function articleDate(article: ArticleDistributionDatum) {
  return article.publicationDate ?? dateString(article.publicationYear);
}

function periodKey(date: string, granularity: TimeGranularity) {
  if (granularity === "year") {
    return date.slice(0, 4);
  }

  if (granularity === "month") {
    return date.slice(0, 7);
  }

  return date.slice(0, 10);
}

function groupLabel(article: ArticleDistributionDatum, grouping: ArticleGrouping) {
  if (grouping === "journal") {
    return journalCodesByName[article.journal] ?? article.journal;
  }

  if (grouping === "articleCategory") {
    return article.articleCategory;
  }

  if (grouping === "classification") {
    return article.classification ?? "Unclassified";
  }

  return "All articles";
}

function xAxisLabel(
  article: ArticleDistributionDatum,
  axis: ArticleXAxis,
  granularity: TimeGranularity
) {
  if (axis === "publicationDate") {
    return periodKey(articleDate(article), granularity);
  }

  if (axis === "article") {
    return article.title ?? article.id;
  }

  if (axis === "journal") {
    return journalCodesByName[article.journal] ?? article.journal;
  }

  if (axis === "articleCategory") {
    return article.articleCategory;
  }

  return `${journalCodesByName[article.journal] ?? article.journal} / ${article.articleCategory}`;
}

function articleMetricValue(
  article: ArticleDistributionDatum,
  metric: PairMetric,
  metricTable?: ResearchTable
) {
  if (metric === "count") {
    return 1;
  }

  if (metric === "JIF") {
    const journalCode = journalCodesByName[article.journal] ?? article.journal;
    return findMetricRecord(metricTable, journalCode, article.publicationYear + 2, "JIF") ?? 0;
  }

  return article[metric] ?? 0;
}

function summarizeValues(values: number[], statistic: Exclude<ArticleStatistic, "percentage">) {
  if (statistic === "count") {
    return values.length;
  }

  if (statistic === "sum") {
    return values.reduce((sum, value) => sum + value, 0);
  }

  if (statistic === "median" || statistic === "q1q3") {
    return median(values);
  }

  return mean(values);
}

function articleFilterHref({
  journal,
  year,
  category,
  classification
}: {
  journal?: string;
  year?: number;
  category?: string;
  classification?: string;
}) {
  const params = new URLSearchParams();

  if (journal && journalNames[journal]) {
    params.set("journal", journalNames[journal]);
  } else if (journal && journalCodesByName[journal]) {
    params.set("journal", journal);
  }

  if (year) {
    params.set("yearFrom", String(year));
    params.set("yearTo", String(year));
  }

  if (category) {
    params.set("articleCategory", category);
  }

  if (classification) {
    params.set("classification", classification);
  }

  const query = params.toString();
  return query ? `/articles?${query}` : "/articles";
}

function erfComplement(value: number) {
  const z = Math.abs(value);
  const t = 1 / (1 + z / 2);
  const approximation =
    t *
    Math.exp(
      -z * z -
        1.26551223 +
        t *
          (1.00002368 +
            t *
              (0.37409196 +
                t *
                  (0.09678418 +
                    t *
                      (-0.18628806 +
                        t *
                          (0.27886807 +
                            t *
                              (-1.13520398 +
                                t *
                                  (1.48851587 +
                                    t * (-0.82215223 + t * 0.17087277))))))))
    );
  return value >= 0 ? approximation : 2 - approximation;
}

function twoSidedNormalP(zScore: number) {
  return Math.max(0, Math.min(1, erfComplement(Math.abs(zScore) / Math.SQRT2)));
}

function rank(values: number[]) {
  const sorted = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value);
  const ranks = Array(values.length).fill(0) as number[];

  for (let index = 0; index < sorted.length; ) {
    let end = index + 1;
    while (end < sorted.length && sorted[end].value === sorted[index].value) {
      end += 1;
    }
    const averageRank = (index + end + 1) / 2;
    for (let cursor = index; cursor < end; cursor += 1) {
      ranks[sorted[cursor].index] = averageRank;
    }
    index = end;
  }

  return ranks;
}

function correlation(xValues: number[], yValues: number[]) {
  if (xValues.length < 2 || yValues.length < 2) {
    return 0;
  }

  const xMean = mean(xValues);
  const yMean = mean(yValues);
  let numerator = 0;
  let xDenominator = 0;
  let yDenominator = 0;

  xValues.forEach((x, index) => {
    const xDelta = x - xMean;
    const yDelta = yValues[index] - yMean;
    numerator += xDelta * yDelta;
    xDenominator += xDelta ** 2;
    yDenominator += yDelta ** 2;
  });

  const denominator = Math.sqrt(xDenominator * yDenominator);
  return denominator > 0 ? numerator / denominator : 0;
}

function correlationPValue(rValue: number, count: number) {
  if (count < 4 || Math.abs(rValue) >= 1) {
    return count < 4 ? 1 : 0;
  }

  const zScore = 0.5 * Math.log((1 + rValue) / (1 - rValue)) * Math.sqrt(count - 3);
  return twoSidedNormalP(zScore);
}

function linearRegression(points: { x: number; y: number }[]) {
  if (points.length < 2) {
    return {
      slope: 0,
      intercept: points[0]?.y ?? 0,
      pearson: 0,
      pearsonP: 1,
      spearman: 0,
      spearmanP: 1,
      n: points.length
    };
  }

  const xValues = points.map((point) => point.x);
  const yValues = points.map((point) => point.y);
  const xMean = mean(xValues);
  const yMean = mean(yValues);
  const denominator = xValues.reduce((sum, value) => sum + (value - xMean) ** 2, 0);
  const slope =
    denominator > 0
      ? points.reduce((sum, point) => sum + (point.x - xMean) * (point.y - yMean), 0) /
        denominator
      : 0;
  const intercept = yMean - slope * xMean;
  const pearson = correlation(xValues, yValues);
  const spearman = correlation(rank(xValues), rank(yValues));

  return {
    slope,
    intercept,
    pearson,
    pearsonP: correlationPValue(pearson, points.length),
    spearman,
    spearmanP: correlationPValue(spearman, points.length),
    n: points.length
  };
}

function histogramOption({
  title,
  values,
  meanValue,
  medianValue
}: {
  title: string;
  values: number[];
  meanValue: number;
  medianValue: number;
}): EChartsOption {
  const bins = 18;
  const max = Math.max(...values, 1);
  const width = Math.max(max / bins, 1);
  const data = Array.from({ length: bins }, (_, index) => {
    const start = index * width;
    const end = index === bins - 1 ? max : start + width;
    return {
      label: `${Math.round(start)}-${Math.round(end)}`,
      count: values.filter((value) =>
        index === bins - 1 ? value >= start && value <= end : value >= start && value < end
      ).length,
      start,
      end
    };
  });

  return {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" }
    },
    grid: { top: 34, left: 48, right: 28, bottom: 56 },
    xAxis: {
      type: "category",
      data: data.map((bin) => bin.label),
      axisLabel: { color: "#5F6368", rotate: 35 }
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#5F6368" },
      splitLine: { lineStyle: { color: "#E0E3EB" } }
    },
    series: [
      {
        name: title,
        type: "bar",
        data: data.map((bin) => bin.count),
        itemStyle: {
          color: {
            type: "linear" as const,
            x: 0,
            y: 0,
            x2: 1,
            y2: 1,
            colorStops: [
              { offset: 0, color: "#1A73E8" },
              { offset: 1, color: "#A8DAB5" }
            ]
          },
          borderRadius: [8, 8, 0, 0]
        },
        markLine: {
          symbol: "none",
          data: [
            {
              name: "Mean",
              xAxis: Math.max(0, Math.min(bins - 1, Math.floor(meanValue / width))),
              label: { formatter: `Mean ${meanValue.toFixed(1)}` },
              lineStyle: { color: "#D93025", width: 2 }
            },
            {
              name: "Median",
              xAxis: Math.max(0, Math.min(bins - 1, Math.floor(medianValue / width))),
              label: { formatter: `Median ${medianValue.toFixed(1)}` },
              lineStyle: { color: "#202124", width: 2, type: "dashed" }
            }
          ]
        }
      }
    ]
  };
}

function makeOption({
  table,
  activeColumn,
  chartMode,
  valueMode,
  selectedJournal,
  metricTable,
  baselineMetric,
  granularity,
  startDate,
  endDate
}: {
  table: ResearchTable;
  activeColumn: string;
  chartMode: ChartMode;
  valueMode: ValueMode;
  selectedJournal: string;
  metricTable?: ResearchTable;
  baselineMetric: string;
  granularity: TimeGranularity;
  startDate: string;
  endDate: string;
}): EChartsOption {
  const years = uniqueSorted(table.records.map((record) => record.year));
  const journals = uniqueSorted(table.records.map((record) => record.journalCode));
  const axis = { axisLabel: { color: "#5F6368" } };
  const grid = { top: 54, left: 58, right: 28, bottom: 52 };

  if (chartMode === "heatmap") {
    const values = table.records
      .map((record) => getCellValue(record.values[activeColumn], valueMode))
      .filter((value): value is number => typeof value === "number");

    const labels = timeLabels(years, granularity, startDate, endDate);

    return {
      tooltip: {
        trigger: "item",
        formatter: (params: unknown) => {
          const item = params as { data?: [number, number, number | null, number] };
          if (!item.data) {
            return "";
          }
          const [xIndex, yIndex, value, year] = item.data;
          return `${journals[yIndex]} ${labels[xIndex]}<br/>${activeColumn}: ${
            value === null ? "NA" : value.toLocaleString()
          }<br/>Article year: ${year}<br/>Click to open matching articles`;
        }
      },
      grid,
      xAxis: {
        type: "category",
        data: labels,
        ...axis,
        axisLabel: { color: "#5F6368", show: granularity !== "day" }
      },
      yAxis: { type: "category", data: journals, ...axis },
      visualMap: {
        min: 0,
        max: Math.max(...values, 1),
        orient: "horizontal",
        left: "center",
        bottom: 4,
        calculable: true,
        inRange: { color: ["#EEF5FF", "#A8DAB5", "#1A73E8"] },
        textStyle: { color: "#5F6368" }
      },
      series: [
        {
          type: "heatmap",
          cursor: "pointer",
          data: journals.flatMap((journal, yIndex) =>
            labels.map((date, xIndex) => {
              const year = yearFromDate(date);
              return [
                xIndex,
                yIndex,
                getRecordValue(table.records, journal, year, activeColumn, valueMode),
                year
              ];
            })
          )
        }
      ]
    };
  }

  if (chartMode === "composition") {
    const journal =
      journals.includes(selectedJournal) ? selectedJournal : (journals[0] ?? selectedJournal);

    return {
      tooltip: {
        trigger: "axis",
        valueFormatter: (value) =>
          typeof value === "number" ? value.toLocaleString() : String(value)
      },
      legend: { top: 0, type: "scroll", textStyle: { color: "#5F6368" } },
      grid,
      xAxis: { type: "time", ...axis },
      yAxis: { type: "value", ...axis, splitLine: { lineStyle: { color: "#E0E3EB" } } },
      series: table.columns.map((column) => ({
        name: column,
        type: "line",
        smooth: true,
        stack: "composition",
        cursor: "pointer",
        showSymbol: granularity === "year",
        sampling: granularity === "year" ? undefined : "lttb",
        areaStyle: { opacity: 0.2 },
        symbolSize: 7,
        emphasis: { focus: "series", scale: 1.35 },
        data: expandedSeriesData({
          records: table.records,
          journal,
          column,
          mode: valueMode,
          granularity,
          startDate,
          endDate
        })
      }))
    };
  }

  if (chartMode === "association") {
    return {
      tooltip: {
        trigger: "item",
        formatter: (params: unknown) => {
          const item = params as {
            data?: [number, number, number, string];
            seriesName?: string;
          };
          if (!item.data) {
            return "";
          }
          const [xValue, yValue, year, raw] = item.data;
          return `${item.seriesName} ${year}<br/>${baselineMetric}: ${xValue.toLocaleString()}<br/>${activeColumn}: ${yValue.toLocaleString()}<br/>${raw}<br/>Click to open matching articles`;
        }
      },
      legend: { top: 0, textStyle: { color: "#5F6368" } },
      grid,
      xAxis: {
        type: "value",
        name: baselineMetric,
        nameTextStyle: { color: "#5F6368" },
        ...axis,
        splitLine: { lineStyle: { color: "#E0E3EB" } }
      },
      yAxis: {
        type: "value",
        name: activeColumn,
        nameTextStyle: { color: "#5F6368" },
        ...axis,
        splitLine: { lineStyle: { color: "#E0E3EB" } }
      },
      series: journals.map((journal) => ({
        name: journal,
        type: "scatter",
        cursor: "pointer",
        symbolSize: (value: unknown) => {
          const point = value as [number, number];
          return Math.max(9, Math.min(30, 9 + Math.sqrt(Math.max(point[1], 0))));
        },
        itemStyle: { color: journalColors[journal] },
        emphasis: { focus: "series", scale: 1.35 },
        data: table.records
          .filter((record) => record.journalCode === journal)
          .filter((record) =>
            dateWithin(dateString(record.year), startDate, endDate)
          )
          .map((record) => {
            const x = findMetricRecord(metricTable, journal, record.year + 2, baselineMetric);
            const y = getCellValue(record.values[activeColumn], valueMode);
            return x !== null && y !== null
              ? [x, y, record.year, record.values[activeColumn]?.raw ?? ""]
              : null;
          })
          .filter(Boolean)
      }))
    };
  }

  return {
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) =>
        typeof value === "number" ? value.toLocaleString() : String(value)
    },
    legend: { top: 0, type: "scroll", textStyle: { color: "#5F6368" } },
    grid,
    xAxis: { type: "time", ...axis },
    yAxis: { type: "value", ...axis, splitLine: { lineStyle: { color: "#E0E3EB" } } },
    series: journals.map((journal) => ({
      name: journal,
      type: "line",
      smooth: true,
      cursor: "pointer",
      showSymbol: granularity === "year",
      sampling: granularity === "year" ? undefined : "lttb",
      symbolSize: 8,
      lineStyle: { width: 3, color: journalColors[journal] },
      itemStyle: { color: journalColors[journal] },
      emphasis: { focus: "series", scale: 1.35 },
      data: expandedSeriesData({
        records: table.records,
        journal,
        column: activeColumn,
        mode: valueMode,
        granularity,
        startDate,
        endDate
      })
    }))
  };
}

interface RegressionSummary {
  group: string;
  slope: number;
  intercept: number;
  pearson: number;
  pearsonP: number;
  spearman: number;
  spearmanP: number;
  n: number;
}

interface ArticleAggregateBucket {
  xLabel: string;
  group: string;
  values: number[];
  articles: ArticleDistributionDatum[];
  denominatorKey: string;
}

function seriesColor(group: string, index: number) {
  const direct = journalColors[group];
  if (direct) {
    return direct;
  }

  const palette = ["#1A73E8", "#12A182", "#D93025", "#F9AB00", "#7C4DFF", "#00ACC1"];
  return palette[index % palette.length];
}

function periodToEChartsValue(period: string, granularity: TimeGranularity) {
  if (granularity === "year") {
    return `${period}-01-01`;
  }

  if (granularity === "month") {
    return `${period}-01`;
  }

  return period;
}

function uniqueValue(values: Array<string | undefined>) {
  const unique = Array.from(new Set(values.filter(Boolean) as string[]));
  return unique.length === 1 ? unique[0] : undefined;
}

function isArticleAggregateBucket(
  bucket: ArticleAggregateBucket | undefined
): bucket is ArticleAggregateBucket {
  return Boolean(bucket);
}

function buildArticlePlotOption({
  articles,
  metricTable,
  plotKind,
  xAxis,
  grouping,
  metric,
  statistic,
  percentageDenominator,
  granularity,
  startDate,
  endDate
}: {
  articles: ArticleDistributionDatum[];
  metricTable?: ResearchTable;
  plotKind: Exclude<ArticlePlotKind, "pairing">;
  xAxis: ArticleXAxis;
  grouping: ArticleGrouping;
  metric: ArticleMetric;
  statistic: ArticleStatistic;
  percentageDenominator: PercentageDenominator;
  granularity: TimeGranularity;
  startDate: string;
  endDate: string;
}): EChartsOption {
  const visibleArticles = articles.filter((article) =>
    dateWithin(articleDate(article), startDate, endDate)
  );
  const metricValues = visibleArticles.map((article) =>
    articleMetricValue(article, metric, metricTable)
  );

  if (plotKind === "histogram") {
    const bins = 20;
    const max = Math.max(...metricValues, 1);
    const width = Math.max(max / bins, 1);
    const groups = uniqueSorted(visibleArticles.map((article) => groupLabel(article, grouping)));
    const labels = Array.from({ length: bins }, (_, index) => {
      const start = index * width;
      const end = index === bins - 1 ? max : start + width;
      return `${Math.round(start)}-${Math.round(end)}`;
    });

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" }
      },
      legend: { top: 0, type: "scroll", textStyle: { color: "#5F6368" } },
      grid: { top: 50, left: 56, right: 24, bottom: 76 },
      xAxis: { type: "category", data: labels, axisLabel: { color: "#5F6368", rotate: 32 } },
      yAxis: {
        type: "value",
        axisLabel: { color: "#5F6368" },
        splitLine: { lineStyle: { color: "#E0E3EB" } }
      },
      series: groups.map((group, groupIndex) => ({
        name: group,
        type: "bar",
        stack: grouping === "none" ? undefined : "histogram",
        cursor: "pointer",
        itemStyle: { color: seriesColor(group, groupIndex), borderRadius: [6, 6, 0, 0] },
        data: labels.map((label, index) => {
          const start = index * width;
          const end = index === bins - 1 ? max : start + width;
          const matches = visibleArticles.filter((article) => {
            const value = articleMetricValue(article, metric, metricTable);
            return (
              groupLabel(article, grouping) === group &&
              (index === bins - 1 ? value >= start && value <= end : value >= start && value < end)
            );
          });
          return {
            value: matches.length,
            custom: {
              group,
              xLabel: label,
              journal: uniqueValue(matches.map((article) => article.journal)),
              category: uniqueValue(matches.map((article) => article.articleCategory)),
              classification: uniqueValue(matches.map((article) => article.classification))
            }
          };
        }),
        markLine:
          groupIndex === 0
            ? {
                symbol: "none",
                data: [
                  {
                    name: "Mean",
                    xAxis: Math.max(0, Math.min(bins - 1, Math.floor(mean(metricValues) / width))),
                    label: { formatter: `Mean ${formatNumber(mean(metricValues))}` },
                    lineStyle: { color: "#D93025", width: 2 }
                  },
                  {
                    name: "Median",
                    xAxis: Math.max(0, Math.min(bins - 1, Math.floor(median(metricValues) / width))),
                    label: { formatter: `Median ${formatNumber(median(metricValues))}` },
                    lineStyle: { color: "#202124", width: 2, type: "dashed" }
                  }
                ]
              }
            : undefined
      }))
    };
  }

  const denominatorCounts = new Map<string, number>();
  const denominatorKey = (article: ArticleDistributionDatum, xLabel: string) => {
    if (percentageDenominator === "period") {
      return xLabel;
    }
    if (percentageDenominator === "journal") {
      return article.journal;
    }
    if (percentageDenominator === "category") {
      return article.articleCategory;
    }
    return "all";
  };

  visibleArticles.forEach((article) => {
    const xLabel = xAxisLabel(article, xAxis, granularity);
    const key = denominatorKey(article, xLabel);
    denominatorCounts.set(key, (denominatorCounts.get(key) ?? 0) + 1);
  });

  const buckets = new Map<string, ArticleAggregateBucket>();

  visibleArticles.forEach((article) => {
    const xLabel = xAxisLabel(article, xAxis, granularity);
    const group = groupLabel(article, grouping);
    const key = `${group}::${xLabel}`;
    const bucket =
      buckets.get(key) ??
      {
        xLabel,
        group,
        values: [],
        articles: [],
        denominatorKey: denominatorKey(article, xLabel)
      };
    bucket.values.push(articleMetricValue(article, metric, metricTable));
    bucket.articles.push(article);
    buckets.set(key, bucket);
  });

  const groups = uniqueSorted(Array.from(buckets.values()).map((bucket) => bucket.group));
  const axisLabels = uniqueSorted(Array.from(buckets.values()).map((bucket) => bucket.xLabel));
  const isTimeAxis = xAxis === "publicationDate";
  const yAxisName = statistic === "percentage" ? "Percentage" : metricLabel(metric);

  const makeDatum = (bucket: ArticleAggregateBucket) => {
    const value =
      statistic === "percentage"
        ? (bucket.articles.length / Math.max(denominatorCounts.get(bucket.denominatorKey) ?? 1, 1)) *
          100
        : summarizeValues(bucket.values, statistic as Exclude<ArticleStatistic, "percentage">);
    const lower =
      statistic === "q1q3"
        ? quantile(bucket.values, 0.25)
        : statistic === "se"
          ? value - standardError(bucket.values)
          : value;
    const upper =
      statistic === "q1q3"
        ? quantile(bucket.values, 0.75)
        : statistic === "se"
          ? value + standardError(bucket.values)
          : value;
    const first = bucket.articles[0];
    return {
      value: [
        isTimeAxis ? periodToEChartsValue(bucket.xLabel, granularity) : bucket.xLabel,
        value
      ],
      custom: {
        xLabel: bucket.xLabel,
        group: bucket.group,
        value,
        lower,
        upper,
        count: bucket.articles.length,
        articleId: xAxis === "article" && bucket.articles.length === 1 ? first?.id : undefined,
        journal: uniqueValue(bucket.articles.map((article) => article.journal)),
        category: uniqueValue(bucket.articles.map((article) => article.articleCategory)),
        classification: uniqueValue(bucket.articles.map((article) => article.classification)),
        year: isTimeAxis ? Number(bucket.xLabel.slice(0, 4)) : undefined
      }
    };
  };

  const mainSeries = groups.map((group, groupIndex) => {
    const data = axisLabels
      .map((label) => buckets.get(`${group}::${label}`))
      .filter(isArticleAggregateBucket)
      .map((bucket) => makeDatum(bucket));

    return {
      name: group,
      type: plotKind === "bar" ? ("bar" as const) : ("line" as const),
      smooth: plotKind === "line",
      cursor: "pointer",
      sampling: isTimeAxis && granularity !== "year" ? "lttb" : undefined,
      showSymbol: plotKind === "line" && granularity === "year",
      symbolSize: 8,
      itemStyle: {
        color: seriesColor(group, groupIndex),
        borderRadius: plotKind === "bar" ? [8, 8, 0, 0] : undefined
      },
      lineStyle: { width: 3, color: seriesColor(group, groupIndex) },
      emphasis: { focus: "series" as const, scale: 1.25 },
      data
    };
  });

  const intervalSeries =
    statistic === "se" || statistic === "q1q3"
      ? groups.flatMap((group, groupIndex) => {
          const color = seriesColor(group, groupIndex);
          const points = axisLabels
            .map((label) => buckets.get(`${group}::${label}`))
            .filter(isArticleAggregateBucket)
            .map((bucket) => makeDatum(bucket));
          return [
            {
              name: `${group} lower`,
              type: "line" as const,
              silent: true,
              showSymbol: false,
              lineStyle: { color, width: 1, type: "dashed", opacity: 0.65 },
              data: points.map((point) => ({
                value: [point.value[0], point.custom.lower]
              }))
            },
            {
              name: `${group} upper`,
              type: "line" as const,
              silent: true,
              showSymbol: false,
              lineStyle: { color, width: 1, type: "dashed", opacity: 0.65 },
              data: points.map((point) => ({
                value: [point.value[0], point.custom.upper]
              }))
            }
          ];
        })
      : [];

  return {
    tooltip: {
      trigger: plotKind === "bar" ? "axis" : "item",
      formatter: (params: unknown) => {
        const item = Array.isArray(params) ? params[0] : params;
        const data = (item as { data?: { custom?: Record<string, unknown> } }).data?.custom;
        if (!data) {
          return "";
        }
        return `${data.group}<br/>${data.xLabel}<br/>${yAxisName}: ${formatNumber(
          Number(data.value)
        )}<br/>Articles: ${data.count}<br/>Click to open matching articles`;
      }
    },
    legend: { top: 0, type: "scroll", textStyle: { color: "#5F6368" } },
    grid: { top: 54, left: 64, right: 24, bottom: isTimeAxis ? 60 : 92 },
    xAxis: {
      type: isTimeAxis ? "time" : "category",
      data: isTimeAxis ? undefined : axisLabels,
      axisLabel: {
        color: "#5F6368",
        rotate: isTimeAxis ? 0 : 34,
        hideOverlap: true
      }
    },
    yAxis: {
      type: "value",
      name: yAxisName,
      nameTextStyle: { color: "#5F6368" },
      axisLabel: { color: "#5F6368" },
      splitLine: { lineStyle: { color: "#E0E3EB" } }
    },
    series: [...mainSeries, ...intervalSeries] as EChartsOption["series"]
  };
}

function pairBucketKey(
  article: ArticleDistributionDatum,
  granularity: PairGranularity
) {
  if (granularity === "article") {
    return article.id;
  }

  if (granularity === "year" || granularity === "month" || granularity === "day") {
    return periodKey(articleDate(article), granularity);
  }

  if (granularity === "journal") {
    return journalCodesByName[article.journal] ?? article.journal;
  }

  if (granularity === "articleCategory") {
    return article.articleCategory;
  }

  return `${journalCodesByName[article.journal] ?? article.journal} / ${article.articleCategory}`;
}

function buildMetricPairingOption({
  articles,
  metricTable,
  xMetric,
  yMetric,
  sizeMetric,
  pairGrouping,
  pairGranularity,
  pairStatistic,
  startDate,
  endDate
}: {
  articles: ArticleDistributionDatum[];
  metricTable?: ResearchTable;
  xMetric: PairMetric;
  yMetric: PairMetric;
  sizeMetric: PairMetric;
  pairGrouping: ArticleGrouping;
  pairGranularity: PairGranularity;
  pairStatistic: Exclude<ArticleStatistic, "percentage" | "se" | "q1q3">;
  startDate: string;
  endDate: string;
}): { option: EChartsOption; regressions: RegressionSummary[] } {
  const visibleArticles = articles.filter((article) =>
    dateWithin(articleDate(article), startDate, endDate)
  );
  const buckets = new Map<
    string,
    {
      label: string;
      group: string;
      articles: ArticleDistributionDatum[];
      xValues: number[];
      yValues: number[];
      sizeValues: number[];
    }
  >();

  visibleArticles.forEach((article) => {
    const label = pairBucketKey(article, pairGranularity);
    const group = groupLabel(article, pairGrouping);
    const key = `${group}::${label}`;
    const bucket =
      buckets.get(key) ??
      { label, group, articles: [], xValues: [], yValues: [], sizeValues: [] };
    bucket.articles.push(article);
    bucket.xValues.push(articleMetricValue(article, xMetric, metricTable));
    bucket.yValues.push(articleMetricValue(article, yMetric, metricTable));
    bucket.sizeValues.push(articleMetricValue(article, sizeMetric, metricTable));
    buckets.set(key, bucket);
  });

  const groups = uniqueSorted(Array.from(buckets.values()).map((bucket) => bucket.group));
  const groupPoints = groups.map((group) => {
    const points = Array.from(buckets.values())
      .filter((bucket) => bucket.group === group)
      .map((bucket) => {
        const x = summarizeValues(bucket.xValues, pairStatistic);
        const y = summarizeValues(bucket.yValues, pairStatistic);
        const sizeValue = summarizeValues(bucket.sizeValues, pairStatistic);
        return {
          x,
          y,
          symbolSize: Math.max(9, Math.min(42, 8 + Math.sqrt(Math.max(sizeValue, 0)))),
          label: bucket.label,
          count: bucket.articles.length,
          articleId:
            pairGranularity === "article" && bucket.articles.length === 1
              ? bucket.articles[0].id
              : undefined,
          journal: uniqueValue(bucket.articles.map((article) => article.journal)),
          category: uniqueValue(bucket.articles.map((article) => article.articleCategory)),
          classification: uniqueValue(bucket.articles.map((article) => article.classification)),
          year:
            pairGranularity === "year" || pairGranularity === "month" || pairGranularity === "day"
              ? Number(bucket.label.slice(0, 4))
              : undefined
        };
      })
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    const regression = linearRegression(points);
    return { group, points, regression };
  });

  const regressions = groupPoints.map(({ group, regression }) => ({
    group,
    ...regression
  }));

  const scatterSeries = groupPoints.map(({ group, points }, groupIndex) => ({
    name: group,
    type: "scatter" as const,
    cursor: "pointer",
    symbolSize: (value: unknown) => {
      const point = value as [number, number, number];
      return point[2] ?? 10;
    },
    itemStyle: { color: seriesColor(group, groupIndex), opacity: 0.82 },
    emphasis: { focus: "series" as const, scale: 1.25 },
    data: points.map((point) => ({
      value: [point.x, point.y, point.symbolSize],
      custom: point
    }))
  }));

  const regressionSeries = groupPoints.flatMap(({ group, points, regression }, groupIndex) => {
    if (points.length < 2) {
      return [];
    }

    const sortedX = points.map((point) => point.x).sort((a, b) => a - b);
    const minX = sortedX[0];
    const maxX = sortedX[sortedX.length - 1];
    return [
      {
        name: `${group} regression`,
        type: "line" as const,
        silent: true,
        showSymbol: false,
        lineStyle: { color: seriesColor(group, groupIndex), width: 2, opacity: 0.72 },
        data: [
          [minX, regression.slope * minX + regression.intercept],
          [maxX, regression.slope * maxX + regression.intercept]
        ]
      }
    ];
  });

  return {
    regressions,
    option: {
      tooltip: {
        trigger: "item",
        formatter: (params: unknown) => {
          const data = (params as { data?: { custom?: Record<string, unknown> } }).data?.custom;
          if (!data) {
            return "";
          }
          return `${data.label}<br/>${metricLabel(xMetric)}: ${formatNumber(
            Number(data.x)
          )}<br/>${metricLabel(yMetric)}: ${formatNumber(
            Number(data.y)
          )}<br/>Articles: ${data.count}<br/>Click to open matching articles`;
        }
      },
      legend: { top: 0, type: "scroll", textStyle: { color: "#5F6368" } },
      grid: { top: 54, left: 72, right: 24, bottom: 64 },
      xAxis: {
        type: "value",
        name: metricLabel(xMetric),
        nameTextStyle: { color: "#5F6368" },
        axisLabel: { color: "#5F6368" },
        splitLine: { lineStyle: { color: "#E0E3EB" } }
      },
      yAxis: {
        type: "value",
        name: metricLabel(yMetric),
        nameTextStyle: { color: "#5F6368" },
        axisLabel: { color: "#5F6368" },
        splitLine: { lineStyle: { color: "#E0E3EB" } }
      },
      series: [...scatterSeries, ...regressionSeries] as EChartsOption["series"]
    }
  };
}

function ArticlePlotWorkbench({
  articles,
  metricTable,
  topics,
  onPreset
}: {
  articles: ArticleDistributionDatum[];
  metricTable?: ResearchTable;
  topics: MainFigureLegend[];
  onPreset: (topic: MainFigureLegend) => void;
}) {
  const router = useRouter();
  const [plotKind, setPlotKind] = useState<ArticlePlotKind>("line");
  const [xAxis, setXAxis] = useState<ArticleXAxis>("publicationDate");
  const [grouping, setGrouping] = useState<ArticleGrouping>("journal");
  const [metric, setMetric] = useState<ArticleMetric>("twoYearCitationCount");
  const [statistic, setStatistic] = useState<ArticleStatistic>("mean");
  const [percentageDenominator, setPercentageDenominator] =
    useState<PercentageDenominator>("period");
  const [granularity, setGranularity] = useState<TimeGranularity>("year");
  const [xMetric, setXMetric] = useState<PairMetric>("JIF");
  const [yMetric, setYMetric] = useState<PairMetric>("twoYearCitationCount");
  const [sizeMetric, setSizeMetric] = useState<PairMetric>("totalCitationCount");
  const [pairGrouping, setPairGrouping] = useState<ArticleGrouping>("journal");
  const [pairGranularity, setPairGranularity] = useState<PairGranularity>("year");
  const [pairStatistic, setPairStatistic] =
    useState<Exclude<ArticleStatistic, "percentage" | "se" | "q1q3">>("mean");
  const [presetQuery, setPresetQuery] = useState("");
  const minDate = articles.reduce(
    (minimum, article) => (articleDate(article) < minimum ? articleDate(article) : minimum),
    "2008-01-01"
  );
  const maxDate = articles.reduce(
    (maximum, article) => (articleDate(article) > maximum ? articleDate(article) : maximum),
    "2022-12-31"
  );
  const [startDate, setStartDate] = useState(minDate);
  const [endDate, setEndDate] = useState(maxDate);
  const boundedStartDate = startDate < minDate || startDate > maxDate ? minDate : startDate;
  const boundedEndDate = endDate < boundedStartDate || endDate > maxDate ? maxDate : endDate;

  const filteredTopics = topics.filter((topic) => {
    const query = presetQuery.trim().toLowerCase();
    return (
      !query ||
      figureTopic(topic).toLowerCase().includes(query) ||
      topic.legend.toLowerCase().includes(query)
    );
  });

  const pairing = useMemo(
    () =>
      buildMetricPairingOption({
        articles,
        metricTable,
        xMetric,
        yMetric,
        sizeMetric,
        pairGrouping,
        pairGranularity,
        pairStatistic,
        startDate: boundedStartDate,
        endDate: boundedEndDate
      }),
    [
      articles,
      boundedEndDate,
      boundedStartDate,
      metricTable,
      pairGranularity,
      pairGrouping,
      pairStatistic,
      sizeMetric,
      xMetric,
      yMetric
    ]
  );

  const option = useMemo<EChartsOption>(() => {
    if (plotKind === "pairing") {
      return pairing.option;
    }

    return buildArticlePlotOption({
      articles,
      metricTable,
      plotKind,
      xAxis,
      grouping,
      metric,
      statistic,
      percentageDenominator,
      granularity,
      startDate: boundedStartDate,
      endDate: boundedEndDate
    });
  }, [
    articles,
    boundedEndDate,
    boundedStartDate,
    granularity,
    grouping,
    metric,
    metricTable,
    pairing.option,
    percentageDenominator,
    plotKind,
    statistic,
    xAxis
  ]);

  function openCustomPoint(params: { data?: unknown }) {
    const custom = (params.data as { custom?: Record<string, unknown> } | undefined)?.custom;
    if (!custom) {
      return;
    }

    const articleId = typeof custom.articleId === "string" ? custom.articleId : undefined;
    if (articleId) {
      document.dispatchEvent(new Event("clear-card:navigate"));
      router.push(`/articles/${articleId}`);
      return;
    }

    const journal = typeof custom.journal === "string" ? custom.journal : undefined;
    const category = typeof custom.category === "string" ? custom.category : undefined;
    const classification =
      typeof custom.classification === "string" ? custom.classification : undefined;
    const year = typeof custom.year === "number" ? custom.year : undefined;
    document.dispatchEvent(new Event("clear-card:navigate"));
    router.push(articleFilterHref({ journal, year, category, classification }));
  }

  function applyPreset(topic: MainFigureLegend) {
    const lower = topic.title.toLowerCase();
    onPreset(topic);

    setXAxis("publicationDate");
    setGranularity("year");

    if (lower.includes("publication")) {
      setPlotKind("bar");
      setMetric("count");
      setStatistic(lower.includes("proportion") || lower.includes("among") ? "percentage" : "count");
      setGrouping("articleCategory");
      setPercentageDenominator("period");
      return;
    }

    if (lower.includes("proportion")) {
      setPlotKind("line");
      setMetric("count");
      setStatistic("percentage");
      setGrouping("articleCategory");
      setPercentageDenominator("period");
      return;
    }

    if (lower.includes("fitness")) {
      setPlotKind("line");
      setMetric("fitness");
      setStatistic(lower.includes("median") ? "median" : "mean");
      setGrouping("journal");
      return;
    }

    if (lower.includes("2-year citation")) {
      setPlotKind("line");
      setMetric("twoYearCitationCount");
      setStatistic(lower.includes("median") ? "median" : "mean");
      setGrouping("journal");
      return;
    }

    if (
      lower.includes("jif") ||
      lower.includes("sjr") ||
      lower.includes("snip") ||
      lower.includes("h-index") ||
      lower.includes("predatory")
    ) {
      setPlotKind("pairing");
      setXMetric("JIF");
      setYMetric("twoYearCitationCount");
      setSizeMetric("totalCitationCount");
      setPairGrouping("journal");
      setPairGranularity("year");
      setPairStatistic("mean");
      return;
    }

    setPlotKind("line");
    setMetric("twoYearCitationCount");
    setStatistic("mean");
    setGrouping("journal");
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
      <aside className="rounded-[28px] bg-white/72 p-4 shadow-[0_18px_54px_rgba(60,64,67,0.10)] backdrop-blur-xl dark:bg-white/5">
        <p className="metadata-label">Presets</p>
        <h2 className="mt-1 text-2xl font-semibold text-journal-ink">
          Report presets
        </h2>
        <input
          value={presetQuery}
          onChange={(event) => setPresetQuery(event.target.value)}
          placeholder="Search presets"
          className="mt-4 w-full rounded-full bg-white px-4 py-3 text-sm text-journal-ink shadow-hairline outline-none transition focus:shadow-[0_8px_24px_rgba(60,64,67,0.14)] dark:bg-white/10"
        />
        <div className="mt-3 max-h-[620px] overflow-auto pr-1">
          {filteredTopics.map((topic) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => applyPreset(topic)}
              className="block w-full rounded-3xl px-3 py-3 text-left transition hover:bg-journal-surface/90 dark:hover:bg-white/10"
            >
              <span className="block text-sm font-semibold leading-5 text-journal-ink">
                {figureTopic(topic)}
              </span>
              <span className="mt-1 line-clamp-3 block text-xs leading-5 text-journal-muted">
                {topic.legend}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <section className="rounded-[28px] bg-white/72 p-4 shadow-[0_18px_54px_rgba(60,64,67,0.10)] backdrop-blur-xl dark:bg-white/5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div>
            <p className="metadata-label">Report builder</p>
            <h2 className="mt-1 text-2xl font-semibold text-journal-ink">
              Customized Reports
            </h2>
          </div>
          <SegmentedControl
            value={plotKind}
            onChange={(value) => setPlotKind(value as ArticlePlotKind)}
            options={articlePlotKinds}
          />
        </div>

        {plotKind === "pairing" ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            <SelectControl
              label="X metric"
              value={xMetric}
              onChange={(value) => setXMetric(value as PairMetric)}
              options={pairMetrics.map((item) => item.id)}
              labels={Object.fromEntries(pairMetrics.map((item) => [item.id, item.label]))}
            />
            <SelectControl
              label="Y metric"
              value={yMetric}
              onChange={(value) => setYMetric(value as PairMetric)}
              options={pairMetrics.map((item) => item.id)}
              labels={Object.fromEntries(pairMetrics.map((item) => [item.id, item.label]))}
            />
            <SelectControl
              label="Dot size"
              value={sizeMetric}
              onChange={(value) => setSizeMetric(value as PairMetric)}
              options={pairMetrics.map((item) => item.id)}
              labels={Object.fromEntries(pairMetrics.map((item) => [item.id, item.label]))}
            />
            <SelectControl
              label="Granularity"
              value={pairGranularity}
              onChange={(value) => setPairGranularity(value as PairGranularity)}
              options={pairGranularities.map((item) => item.id)}
              labels={Object.fromEntries(pairGranularities.map((item) => [item.id, item.label]))}
            />
            <SelectControl
              label="Legend"
              value={pairGrouping}
              onChange={(value) => setPairGrouping(value as ArticleGrouping)}
              options={articleGroupings.map((item) => item.id)}
              labels={Object.fromEntries(articleGroupings.map((item) => [item.id, item.label]))}
            />
            <SelectControl
              label="Statistic"
              value={pairStatistic}
              onChange={(value) =>
                setPairStatistic(value as Exclude<ArticleStatistic, "percentage" | "se" | "q1q3">)
              }
              options={["mean", "median", "count", "sum"]}
              labels={{
                mean: "Mean",
                median: "Median",
                count: "Count",
                sum: "Sum"
              }}
            />
            <DateControl
              label="Start"
              value={boundedStartDate}
              min={minDate}
              max={maxDate}
              onChange={setStartDate}
            />
            <DateControl
              label="End"
              value={boundedEndDate}
              min={minDate}
              max={maxDate}
              onChange={setEndDate}
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-8">
            <SelectControl
              label="X axis"
              value={xAxis}
              onChange={(value) => setXAxis(value as ArticleXAxis)}
              options={articleAxes.map((item) => item.id)}
              labels={Object.fromEntries(articleAxes.map((item) => [item.id, item.label]))}
            />
            <SelectControl
              label="Date scale"
              value={granularity}
              onChange={(value) => setGranularity(value as TimeGranularity)}
              options={granularities.map((item) => item.id)}
              labels={Object.fromEntries(granularities.map((item) => [item.id, item.label]))}
            />
            <SelectControl
              label="Metric"
              value={metric}
              onChange={(value) => setMetric(value as ArticleMetric)}
              options={articleMetrics.map((item) => item.id)}
              labels={Object.fromEntries(articleMetrics.map((item) => [item.id, item.label]))}
            />
            <SelectControl
              label="Statistic"
              value={statistic}
              onChange={(value) => setStatistic(value as ArticleStatistic)}
              options={articleStatistics.map((item) => item.id)}
              labels={Object.fromEntries(articleStatistics.map((item) => [item.id, item.label]))}
            />
            <SelectControl
              label="Legend"
              value={grouping}
              onChange={(value) => setGrouping(value as ArticleGrouping)}
              options={articleGroupings.map((item) => item.id)}
              labels={Object.fromEntries(articleGroupings.map((item) => [item.id, item.label]))}
            />
            <SelectControl
              label="Denominator"
              value={percentageDenominator}
              onChange={(value) => setPercentageDenominator(value as PercentageDenominator)}
              options={percentageDenominators.map((item) => item.id)}
              labels={Object.fromEntries(percentageDenominators.map((item) => [item.id, item.label]))}
            />
            <DateControl
              label="Start"
              value={boundedStartDate}
              min={minDate}
              max={maxDate}
              onChange={setStartDate}
            />
            <DateControl
              label="End"
              value={boundedEndDate}
              min={minDate}
              max={maxDate}
              onChange={setEndDate}
            />
          </div>
        )}

        <div className="mt-4">
          <EChart
            option={option}
            height={560}
            onEvents={{
              click: openCustomPoint
            }}
          />
        </div>

        {plotKind === "pairing" ? (
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {pairing.regressions.map((regression) => (
              <div
                key={regression.group}
                className="rounded-3xl bg-journal-surface/80 p-3 text-sm text-journal-slate dark:bg-white/8"
              >
                <p className="font-semibold text-journal-ink">{regression.group}</p>
                <p className="mt-1 tabular-nums">
                  slope {formatNumber(regression.slope)} · intercept{" "}
                  {formatNumber(regression.intercept)}
                </p>
                <p className="mt-1 tabular-nums">
                  Pearson r {formatNumber(regression.pearson)}, p{" "}
                  {formatNumber(regression.pearsonP)}
                </p>
                <p className="mt-1 tabular-nums">
                  Spearman rho {formatNumber(regression.spearman)}, p{" "}
                  {formatNumber(regression.spearmanP)} · n {regression.n}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </section>
  );
}

export function ResultsAtlas({
  dataset,
  articleDistributions
}: {
  dataset: ResearchResultsDataset;
  articleDistributions: ArticleDistributionDatum[];
}) {
  const router = useRouter();
  const defaultTable =
    dataset.supplementalTables.find((table) => table.number === 8) ??
    dataset.supplementalTables[0];
  const [workspaceId, setWorkspaceId] = useState<(typeof resultWorkspaces)[number]["id"]>(
    "citations"
  );
  const [tableId, setTableId] = useState(defaultTable?.id ?? "");
  const [column, setColumn] = useState(defaultTable?.columns[0] ?? "");
  const [chartMode, setChartMode] = useState<ChartMode>("time");
  const [valueMode, setValueMode] = useState<ValueMode>("value");
  const [selectedJournal, setSelectedJournal] = useState("CIRC");
  const [baselineMetric, setBaselineMetric] = useState("JIF");
  const [topicQuery, setTopicQuery] = useState("");
  const [granularity, setGranularity] = useState<TimeGranularity>("year");

  const workspace =
    resultWorkspaces.find((candidate) => candidate.id === workspaceId) ?? resultWorkspaces[0];
  const tables = dataset.supplementalTables.filter((table) =>
    (workspace.tableNumbers as readonly number[]).includes(table.number)
  );
  const table =
    dataset.supplementalTables.find((candidate) => candidate.id === tableId) ??
    defaultTable;
  const activeColumn = table?.columns.includes(column) ? column : table?.columns[0] ?? "";
  const journals = table ? uniqueSorted(table.records.map((record) => record.journalCode)) : [];
  const years = table ? uniqueSorted(table.records.map((record) => record.year)) : [];
  const minDate = dateString(years[0] ?? 2008);
  const maxDate = dateString(years[years.length - 1] ?? 2022, 12, 31);
  const [startDate, setStartDate] = useState(minDate);
  const [endDate, setEndDate] = useState(maxDate);
  const boundedStartDate = startDate < minDate || startDate > maxDate ? minDate : startDate;
  const boundedEndDate = endDate < boundedStartDate || endDate > maxDate ? maxDate : endDate;
  const metricTable = dataset.supplementalTables.find((candidate) => candidate.number === 1);
  const allTopics = [...dataset.mainFigures, ...(dataset.supplementalFigures ?? [])];
  const visibleTopics = allTopics.filter((topic) => {
    const query = topicQuery.trim().toLowerCase();
    return (
      !query ||
      figureTopic(topic).toLowerCase().includes(query) ||
      topic.legend.toLowerCase().includes(query)
    );
  });
  const hasSecondary = table?.records.some(
    (record) => record.values[activeColumn]?.secondaryValue !== null
  );

  const option = useMemo<EChartsOption>(() => {
    if (!table || !activeColumn) {
      return {};
    }

    return makeOption({
      table,
      activeColumn,
      chartMode,
      valueMode,
      selectedJournal,
      metricTable,
      baselineMetric,
      granularity,
      startDate: boundedStartDate,
      endDate: boundedEndDate
    });
  }, [
    activeColumn,
    baselineMetric,
    boundedEndDate,
    boundedStartDate,
    chartMode,
    granularity,
    metricTable,
    selectedJournal,
    table,
    valueMode
  ]);

  if (!table) {
    return (
      <div className="mx-auto max-w-7xl rounded-lg bg-white/70 px-4 py-8 text-center text-sm text-journal-muted shadow-hairline dark:bg-white/5">
        No report data was extracted.
      </div>
    );
  }

  function openArticlesFromChart(params: {
    seriesName?: string;
    dataIndex?: number;
    data?: unknown;
  }) {
    let journal = params.seriesName ?? selectedJournal;
    let year = years[params.dataIndex ?? 0] ?? years[0];
    let metric = chartMode === "composition" ? journal : activeColumn;

    if (chartMode === "heatmap" && Array.isArray(params.data)) {
      const [, yIndex, , pointYear] = params.data as [number, number, number | null, number];
      year = pointYear ?? year;
      journal = journals[yIndex] ?? journal;
      metric = activeColumn;
    }

    if (chartMode === "composition") {
      journal = selectedJournal;
      metric = params.seriesName ?? activeColumn;
      if (Array.isArray(params.data)) {
        year = Number((params.data as [string, number, number])[2]) || year;
      }
    }

    if (chartMode === "time" && Array.isArray(params.data)) {
      year = Number((params.data as [string, number, number])[2]) || year;
    }

    if (chartMode === "association" && Array.isArray(params.data)) {
      year = Number((params.data as [number, number, number])[2]) || year;
      journal = params.seriesName ?? journal;
      metric = activeColumn;
    }

    if (journal && year) {
      document.dispatchEvent(new Event("clear-card:navigate"));
      router.push(articleExplorerHref(journal, year, metric));
    }
  }

  return (
    <div className="mx-auto grid max-w-[1800px] gap-8">
      <section className="animate-gentle-pop pt-2">
        <p className="metadata-label">Source tables</p>
        <h2 className="mt-1 text-xl font-semibold text-journal-ink">
          Journal Reports
        </h2>
        <div className="mt-6 flex flex-wrap gap-2">
          {resultWorkspaces.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              onClick={() => {
                const nextTable = dataset.supplementalTables.find((item) =>
                  (candidate.tableNumbers as readonly number[]).includes(item.number)
                );
                setWorkspaceId(candidate.id);
                if (nextTable) {
                  setTableId(nextTable.id);
                  setColumn(nextTable.columns[0] ?? "");
                }
              }}
              className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                candidate.id === workspaceId
                  ? "bg-journal-ink text-white shadow-[0_10px_24px_rgba(60,64,67,0.18)]"
                  : "bg-white/72 text-journal-slate shadow-hairline hover:bg-journal-surface dark:bg-white/8"
              }`}
            >
              {candidate.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-lg bg-white/62 p-3 shadow-[0_18px_54px_rgba(60,64,67,0.10)] backdrop-blur-xl dark:bg-white/5">
          <p className="metadata-label px-2 py-2">{workspace.label} data views</p>
          <div className="grid gap-2">
            {tables.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                onClick={() => {
                  setTableId(candidate.id);
                  setColumn(candidate.columns[0] ?? "");
                }}
                className={`rounded-lg px-3 py-3 text-left transition ${
                  candidate.id === table.id
                    ? "bg-journal-ink text-white shadow-[0_10px_28px_rgba(60,64,67,0.18)]"
                    : "bg-transparent text-journal-slate hover:bg-white/80 dark:hover:bg-white/10"
                }`}
              >
                <span className="block text-sm font-semibold leading-5">
                  {cleanResultTitle(candidate.title)}
                </span>
                <span className={candidate.id === table.id ? "mt-1 block text-xs text-white/72" : "mt-1 block text-xs text-journal-muted"}>
                  {candidate.records.length} journal-year rows · {candidate.columns.length} measures
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-lg bg-white/62 p-4 shadow-[0_18px_54px_rgba(60,64,67,0.10)] backdrop-blur-xl dark:bg-white/5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div>
              <p className="metadata-label">{workspace.label}</p>
              <h3 className="mt-1 text-3xl font-semibold text-journal-ink">
                {cleanResultTitle(table.title)}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {chartModes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setChartMode(mode.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    chartMode === mode.id
                      ? "bg-journal-ink text-white shadow-[0_8px_20px_rgba(60,64,67,0.16)]"
                      : "bg-white/80 text-journal-slate hover:bg-journal-surface dark:bg-white/10"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            <SelectControl
              label="Measure"
              value={activeColumn}
              onChange={(nextValue) => setColumn(nextValue)}
              options={table.columns}
            />
            <SelectControl
              label="Journal focus"
              value={journals.includes(selectedJournal) ? selectedJournal : journals[0]}
              onChange={(nextValue) => setSelectedJournal(nextValue)}
              options={journals}
            />
            <SelectControl
              label="Value"
              value={valueMode}
              onChange={(nextValue) => setValueMode(nextValue as ValueMode)}
              options={["value", "secondary"]}
              labels={{
                value: "Primary value",
                secondary: hasSecondary ? "Parenthetical value" : "Primary value"
              }}
            />
            <SelectControl
              label="Pair with"
              value={baselineMetric}
              onChange={(nextValue) => setBaselineMetric(nextValue)}
              options={metricTable?.columns ?? ["JIF"]}
            />
            <SelectControl
              label="X axis"
              value={granularity}
              onChange={(nextValue) => setGranularity(nextValue as TimeGranularity)}
              options={granularities.map((item) => item.id)}
              labels={Object.fromEntries(granularities.map((item) => [item.id, item.label]))}
            />
            <DateControl
              label="Start"
              value={boundedStartDate}
              min={minDate}
              max={maxDate}
              onChange={setStartDate}
            />
            <DateControl
              label="End"
              value={boundedEndDate}
              min={minDate}
              max={maxDate}
              onChange={setEndDate}
            />
          </div>

          <div className="mt-4">
            <EChart
              option={option}
              height={560}
              onEvents={{
                click: openArticlesFromChart
              }}
            />
          </div>
        </section>
      </section>

      <DistributionPanel
        journalCode={journals.includes(selectedJournal) ? selectedJournal : journals[0]}
        year={yearFromDate(boundedEndDate)}
        articleDistributions={articleDistributions}
        onOpenArticles={(metric) => {
          document.dispatchEvent(new Event("clear-card:navigate"));
          router.push(
            articleExplorerHref(
              journals.includes(selectedJournal) ? selectedJournal : journals[0],
              yearFromDate(boundedEndDate),
              metric
            )
          );
        }}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className="overflow-hidden rounded-lg bg-white/62 shadow-[0_18px_54px_rgba(60,64,67,0.10)] backdrop-blur-xl dark:bg-white/5">
          <div className="px-4 py-3">
            <p className="metadata-label">Data records</p>
          </div>
          <div className="max-h-[520px] overflow-auto">
            <table className="min-w-full divide-y divide-journal-line text-sm">
              <thead className="sticky top-0 bg-white/92 text-left text-xs uppercase text-journal-muted backdrop-blur dark:bg-[#1c1e24]/92">
                <tr>
                  <th className="px-3 py-2">Journal</th>
                  <th className="px-3 py-2">Year</th>
                  {table.columns.map((candidate) => (
                    <th key={candidate} className="px-3 py-2">
                      {candidate}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-journal-line">
                {table.records.map((record) => (
                  <tr
                    key={`${record.journalCode}-${record.year}`}
                    onClick={() => {
                      document.dispatchEvent(new Event("clear-card:navigate"));
                      router.push(articleExplorerHref(record.journalCode, record.year, activeColumn));
                    }}
                    className="cursor-pointer transition hover:bg-journal-surface/80"
                  >
                    <td className="px-3 py-2 font-semibold text-journal-ink">
                      {record.journalCode}
                    </td>
                    <td className="px-3 py-2 text-journal-slate">{record.year}</td>
                    {table.columns.map((candidate) => (
                      <td
                        key={candidate}
                        className="px-3 py-2 tabular-nums text-journal-slate"
                      >
                        {record.values[candidate]?.raw ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="overflow-hidden rounded-lg bg-white/62 shadow-[0_18px_54px_rgba(60,64,67,0.10)] backdrop-blur-xl dark:bg-white/5">
          <div className="p-4">
            <p className="metadata-label">Preset index</p>
            <input
              value={topicQuery}
              onChange={(event) => setTopicQuery(event.target.value)}
              placeholder="Search result topics"
              className="mt-2 w-full rounded-full bg-white px-4 py-3 text-sm text-journal-ink shadow-hairline outline-none transition focus:shadow-[0_8px_24px_rgba(60,64,67,0.14)] dark:bg-white/10"
            />
          </div>
          <div className="max-h-[520px] overflow-auto">
            {visibleTopics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => {
                  const target = topicTarget(topic.title);
                  const nextTable = dataset.supplementalTables.find(
                    (candidate) => candidate.number === target.tableNumber
                  );
                  setWorkspaceId(target.workspaceId);
                  if (nextTable) {
                    setTableId(nextTable.id);
                    setColumn(nextTable.columns[0] ?? "");
                  }
                }}
                className="block w-full px-4 py-3 text-left transition hover:bg-journal-surface/80"
              >
                <h3 className="text-sm font-semibold leading-5 text-journal-ink">
                  {figureTopic(topic)}
                </h3>
                <p className="mt-2 text-xs leading-5 text-journal-muted">
                  {topic.legend}
                </p>
              </button>
            ))}
          </div>
        </aside>
      </section>

      <ArticlePlotWorkbench
        articles={articleDistributions}
        metricTable={metricTable}
        topics={allTopics}
        onPreset={(topic) => {
          const target = topicTarget(topic.title);
          const nextTable = dataset.supplementalTables.find(
            (candidate) => candidate.number === target.tableNumber
          );
          setWorkspaceId(target.workspaceId);
          if (nextTable) {
            setTableId(nextTable.id);
            setColumn(nextTable.columns[0] ?? "");
          }
        }}
      />
    </div>
  );
}

function SelectControl({
  label,
  value,
  onChange,
  options,
  labels
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  labels?: Record<string, string>;
}) {
  return (
    <label className="block">
      <span className="metadata-label">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-full bg-white/86 px-4 py-3 text-sm text-journal-ink shadow-hairline outline-none transition focus:shadow-[0_8px_24px_rgba(60,64,67,0.14)] dark:bg-white/10"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function SegmentedControl<T extends string>({
  value,
  onChange,
  options
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly { id: T; label: string }[];
}) {
  return (
    <div className="flex max-w-full flex-wrap gap-1 rounded-full bg-journal-surface/90 p-1 shadow-hairline dark:bg-white/8">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            value === option.id
              ? "bg-journal-ink text-white shadow-[0_8px_20px_rgba(60,64,67,0.16)]"
              : "text-journal-slate hover:bg-white/80 hover:text-journal-ink dark:hover:bg-white/10"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function DateControl({
  label,
  value,
  min,
  max,
  onChange
}: {
  label: string;
  value: string;
  min: string;
  max: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="metadata-label">{label}</span>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-full bg-white/86 px-4 py-3 text-sm text-journal-ink shadow-hairline outline-none transition focus:shadow-[0_8px_24px_rgba(60,64,67,0.14)] dark:bg-white/10"
      />
    </label>
  );
}

function DistributionPanel({
  journalCode,
  year,
  articleDistributions,
  onOpenArticles
}: {
  journalCode: string;
  year: number;
  articleDistributions: ArticleDistributionDatum[];
  onOpenArticles: (metric: string) => void;
}) {
  const journal = journalNames[journalCode] ?? journalCode;
  const records = articleDistributions.filter(
    (article) => article.journal === journal && article.publicationYear === year
  );
  const citationValues = records.map((article) => article.twoYearCitationCount);
  const fitnessValues = records.map((article) => article.fitness);
  const citationMean = mean(citationValues);
  const citationMedian = median(citationValues);
  const fitnessMean = mean(fitnessValues);
  const fitnessMedian = median(fitnessValues);

  return (
    <section className="grid gap-5 xl:grid-cols-2">
      <article
        role="button"
        tabIndex={0}
        onClick={() => onOpenArticles("ORA")}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onOpenArticles("ORA");
          }
        }}
        className="rounded-lg bg-white/62 p-4 shadow-[0_18px_54px_rgba(60,64,67,0.10)] backdrop-blur-xl transition hover:bg-white/78 dark:bg-white/5"
      >
        <p className="metadata-label">{journalCode} {year}</p>
        <h3 className="mt-1 text-xl font-semibold text-journal-ink">
          2-year Citation Histogram
        </h3>
        <EChart
          option={histogramOption({
            title: "2-year citations",
            values: citationValues,
            meanValue: citationMean,
            medianValue: citationMedian
          })}
          height={320}
        />
      </article>
      <article
        role="button"
        tabIndex={0}
        onClick={() => onOpenArticles("ORA")}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onOpenArticles("ORA");
          }
        }}
        className="rounded-lg bg-white/62 p-4 shadow-[0_18px_54px_rgba(60,64,67,0.10)] backdrop-blur-xl transition hover:bg-white/78 dark:bg-white/5"
      >
        <p className="metadata-label">{journalCode} {year}</p>
        <h3 className="mt-1 text-xl font-semibold text-journal-ink">
          Fitness Histogram
        </h3>
        <EChart
          option={histogramOption({
            title: "Fitness",
            values: fitnessValues,
            meanValue: fitnessMean,
            medianValue: fitnessMedian
          })}
          height={320}
        />
      </article>
    </section>
  );
}
