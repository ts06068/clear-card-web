"use client";

import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import type { CitationPoint, CountDatum, HistogramBin } from "@/types/bibliometric";
import { EChartCard } from "./EChartCard";
import {
  makeCitationTrajectoryOption,
  makeCategoryDistributionOption,
  makeHorizontalBarOption,
  makeYearVolumeOption
} from "./options";

export function JournalVolumeChart({
  data,
  height = 340
}: {
  data: CountDatum[];
  height?: number;
}) {
  const option = useMemo(() => makeHorizontalBarOption(data), [data]);

  return (
    <EChartCard
      title="Article Volume by Journal"
      subtitle="Article counts across the target journals represented in the local explorer."
      option={option}
      height={height}
    />
  );
}

export function PublicationYearVolumeChart({
  data,
  height = 340
}: {
  data: CountDatum[];
  height?: number;
}) {
  const option = useMemo(() => makeYearVolumeOption(data), [data]);

  return (
    <EChartCard
      title="Article Volume by Publication Year"
      subtitle="Publication-year coverage aligned to the CLEAR-CARD manuscript window, 2008 through 2022."
      option={option}
      height={height}
    />
  );
}

export function CategoryDistributionChart({
  data,
  height = 330
}: {
  data: CountDatum[];
  height?: number;
}) {
  const option = useMemo(() => makeCategoryDistributionOption(data), [data]);

  return (
    <EChartCard
      title="Article Category Distribution"
      subtitle="ORA/NORA categories represented in the local article explorer."
      option={option}
      height={height}
    />
  );
}

export function CitationTrajectoryChart({
  points,
  benchmark,
  cumulative = false,
  height = 390
}: {
  points: CitationPoint[];
  benchmark?: CitationPoint[];
  cumulative?: boolean;
  height?: number;
}) {
  const chartPoints = useMemo(() => {
    if (!cumulative) {
      return points;
    }

    let running = 0;
    return points.map((point) => {
      running += point.citations;
      return { year: point.year, citations: running };
    });
  }, [cumulative, points]);
  const option = useMemo(
    () => makeCitationTrajectoryOption(chartPoints, benchmark),
    [benchmark, chartPoints]
  );

  return (
    <EChartCard
      title={cumulative ? "Cumulative Citation Trajectory" : "Yearly Citation Trajectory"}
      subtitle="Article trajectory compared with its journal-year-category mean."
      option={option}
      height={height}
    />
  );
}

export function HistogramChart({
  title,
  subtitle,
  bins,
  markerValue,
  quantile,
  height = 280
}: {
  title: string;
  subtitle?: string;
  bins: HistogramBin[];
  markerValue: number | null;
  quantile: number | null;
  height?: number;
}) {
  const option = useMemo<EChartsOption>(
    () => ({
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" }
      },
      grid: {
        left: 46,
        right: 22,
        top: 28,
        bottom: 46
      },
      xAxis: {
        type: "category" as const,
        data: bins.map((bin) => bin.label),
        axisLabel: { color: "#6B7A90", rotate: 35 }
      },
      yAxis: {
        type: "value" as const,
        axisLabel: { color: "#6B7A90" },
        splitLine: { lineStyle: { color: "#D8DEE8" } }
      },
      series: [
        {
          type: "bar" as const,
          data: bins.map((bin) => bin.count),
          itemStyle: { color: "#1F5D8C" },
          markLine:
            markerValue === null || quantile === null
              ? undefined
              : {
                  symbol: "none",
                  label: {
                    formatter: `Article: ${markerValue.toFixed(1)} (${Math.round(quantile * 100)}th pct)`
                  },
                  lineStyle: {
                    color: "#A22A2F",
                    width: 2
                  },
                  data: [
                    {
                      xAxis: Math.max(
                        0,
                        bins.findIndex((bin) => markerValue >= bin.min && markerValue <= bin.max)
                      )
                    }
                  ]
                }
        }
      ]
    }),
    [bins, markerValue, quantile]
  );

  return <EChartCard title={title} subtitle={subtitle} option={option} height={height} />;
}
