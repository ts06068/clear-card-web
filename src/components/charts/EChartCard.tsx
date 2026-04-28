"use client";

import dynamic from "next/dynamic";
import type { EChartsOption } from "echarts";
import type { EChartsReactProps } from "echarts-for-react";
import { useMemo } from "react";
import { ChartCard } from "@/components/ChartCard";

const ReactECharts = dynamic<EChartsReactProps>(
  () => import("echarts-for-react").then((module) => module.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-journal-muted">
        Loading chart
      </div>
    )
  }
);

const baseChartOption: EChartsOption = {
  color: ["#1A73E8", "#D93025", "#12A182", "#F9AB00", "#5F6368", "#7C4DFF"],
  textStyle: {
    color: "#202124",
    fontFamily:
      "Google Sans, Product Sans, Helvetica Neue, Arial, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
  },
  grid: {
    left: 48,
    right: 20,
    top: 26,
    bottom: 42
  }
};

export function EChartCard({
  title,
  subtitle,
  option,
  loading = false,
  empty = false,
  height = 320,
  onEvents
}: {
  title: string;
  subtitle?: string;
  option?: EChartsOption;
  loading?: boolean;
  empty?: boolean;
  height?: number;
  onEvents?: EChartsReactProps["onEvents"];
}) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <EChart
        option={option}
        loading={loading}
        empty={empty}
        height={height}
        onEvents={onEvents}
      />
    </ChartCard>
  );
}

export function EChart({
  option,
  loading = false,
  empty = false,
  height = 320,
  onEvents
}: {
  option?: EChartsOption;
  loading?: boolean;
  empty?: boolean;
  height?: number;
  onEvents?: EChartsReactProps["onEvents"];
}) {
  const mergedOption = useMemo<EChartsOption>(
    () => ({
      ...baseChartOption,
      ...option,
      tooltip: {
        backgroundColor: "#FFFFFF",
        borderColor: "#E0E3EB",
        borderWidth: 1,
        textStyle: {
          color: "#202124",
          fontSize: 12
        },
        confine: true,
        ...(option?.tooltip ?? {})
      }
    }),
    [option]
  );

  return (
    <div
      className="relative w-full"
      style={{
        height
      }}
    >
      {empty ? (
        <div className="flex h-full items-center justify-center border border-dashed border-journal-line bg-journal-surface text-sm text-journal-muted">
          No chart data available
        </div>
      ) : (
        <ReactECharts
          option={mergedOption}
          loadingOption={{
            text: "Loading",
            color: "#1A73E8",
            textColor: "#5F6368",
            maskColor: "rgba(255,255,255,0.72)"
          }}
          showLoading={loading}
          style={{ height: "100%", width: "100%" }}
          notMerge
          lazyUpdate
          onEvents={onEvents}
        />
      )}
    </div>
  );
}
