import type { EChartsOption } from "echarts";
import type { CitationPoint, CountDatum } from "@/types/bibliometric";
import { formatInteger } from "@/lib/format";

const axisLabel = {
  color: "#425466",
  fontSize: 11
};

const axisLine = {
  lineStyle: {
    color: "#D8DEE8"
  }
};

const splitLine = {
  lineStyle: {
    color: "#E7EBF1"
  }
};

export function makeHorizontalBarOption(data: CountDatum[]): EChartsOption {
  return {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      },
      valueFormatter: (value) =>
        typeof value === "number" ? formatInteger(value) : String(value)
    },
    xAxis: {
      type: "value",
      axisLabel,
      axisLine,
      splitLine
    },
    yAxis: {
      type: "category",
      data: data.map((item) => item.label),
      axisLabel: {
        ...axisLabel,
        width: 190,
        overflow: "truncate"
      },
      axisLine,
      axisTick: {
        show: false
      }
    },
    series: [
      {
        type: "bar",
        data: data.map((item) => item.value),
        barMaxWidth: 22,
        itemStyle: {
          color: "#1F5D8C"
        }
      }
    ]
  };
}

export function makeYearVolumeOption(data: CountDatum[]): EChartsOption {
  return {
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) =>
        typeof value === "number" ? formatInteger(value) : String(value)
    },
    xAxis: {
      type: "category",
      data: data.map((item) => item.label),
      axisLabel,
      axisLine,
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: "value",
      axisLabel,
      axisLine,
      splitLine
    },
    series: [
      {
        type: "line",
        data: data.map((item) => item.value),
        smooth: true,
        symbolSize: 5,
        lineStyle: {
          width: 2,
          color: "#A22A2F"
        },
        itemStyle: {
          color: "#A22A2F"
        },
        areaStyle: {
          color: "rgba(162, 42, 47, 0.08)"
        }
      }
    ]
  };
}

export function makeCategoryDistributionOption(data: CountDatum[]): EChartsOption {
  return {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      },
      valueFormatter: (value) =>
        typeof value === "number" ? formatInteger(value) : String(value)
    },
    xAxis: {
      type: "category",
      data: data.map((item) => item.label),
      axisLabel: {
        ...axisLabel,
        rotate: 35
      },
      axisLine
    },
    yAxis: {
      type: "value",
      axisLabel,
      axisLine,
      splitLine
    },
    series: [
      {
        type: "bar",
        data: data.map((item) => item.value),
        barMaxWidth: 26,
        itemStyle: {
          color: "#397C7A"
        }
      }
    ]
  };
}

export function makeCitationTrajectoryOption(
  points: CitationPoint[],
  benchmark?: CitationPoint[]
): EChartsOption {
  return {
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) =>
        typeof value === "number" ? formatInteger(value) : String(value)
    },
    xAxis: {
      type: "category",
      data: points.map((point) => String(point.year)),
      axisLabel,
      axisLine,
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: "value",
      name: "Citations",
      nameTextStyle: {
        color: "#6B7A90",
        fontSize: 11
      },
      axisLabel,
      axisLine,
      splitLine
    },
    series: [
      {
        name: "Article",
        type: "line",
        data: points.map((point) => point.citations),
        smooth: false,
        symbolSize: 5,
        lineStyle: {
          width: 2,
          color: "#1F5D8C"
        },
        itemStyle: {
          color: "#1F5D8C"
        }
      },
      ...(benchmark
        ? [
            {
              name: "Group mean",
              type: "line" as const,
              data: benchmark.map((point) => point.citations),
              smooth: true,
              symbolSize: 4,
              lineStyle: {
                width: 2,
                type: "dashed" as const,
                color: "#A22A2F"
              },
              itemStyle: {
                color: "#A22A2F"
              }
            }
          ]
        : [])
    ]
  };
}
