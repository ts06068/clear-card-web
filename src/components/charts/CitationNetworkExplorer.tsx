"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { EChartsOption } from "echarts";
import type { CitationNetworkData, CitationNetworkNode } from "@/types/bibliometric";
import { EChart } from "./EChartCard";

const targetJournalColors: Record<string, string> = {
  "Journal of the American College of Cardiology": "#1A73E8",
  Circulation: "#D93025",
  "European Heart Journal": "#12A182",
  "JAMA Cardiology": "#F9AB00"
};

const categorySymbols: Record<string, string> = {
  "Original Research": "circle",
  Review: "rect",
  "Meta-analysis": "diamond",
  "Guideline / Statement / Statistics": "roundRect",
  Editorial: "triangle",
  "Other Non-original": "pin",
  "External Citation": "circle"
};

function percent(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

function shortJournal(journal: string) {
  if (journal === "Journal of the American College of Cardiology") {
    return "JACC";
  }

  if (journal === "European Heart Journal") {
    return "EHJ";
  }

  if (journal === "JAMA Cardiology") {
    return "JAMA Cardiol";
  }

  return journal;
}

function nodeColor(node: CitationNetworkNode) {
  if (node.sourceType === "external-citing") {
    return {
      type: "linear" as const,
      x: 0,
      y: 0,
      x2: 1,
      y2: 1,
      colorStops: [
        { offset: 0, color: "rgba(124,77,255,0.74)" },
        { offset: 1, color: "rgba(26,115,232,0.52)" }
      ]
    };
  }

  const base = targetJournalColors[node.journal] ?? "#1A73E8";
  return {
    type: "linear" as const,
    x: 0,
    y: 0,
    x2: 1,
    y2: 1,
    colorStops: [
      { offset: 0, color: base },
      { offset: 1, color: "rgba(255,255,255,0.52)" }
    ]
  };
}

function hashText(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function nodePosition(node: CitationNetworkNode, index: number) {
  const yearProgress = (node.publicationYear - 2008) / (2022 - 2008);
  const journalIndex = Object.keys(targetJournalColors).indexOf(node.journal);
  const band = node.sourceType === "external-citing" ? 4 : Math.max(journalIndex, 0);
  const hash = hashText(node.id);
  const jitterX = ((hash % 1000) / 1000 - 0.5) * 52;
  const jitterY = (((hash >>> 10) % 1000) / 1000 - 0.5) * 76;
  const wave = Math.sin((yearProgress * Math.PI * 3) + band * 0.85) * 70;

  return {
    x: -760 + yearProgress * 1520 + jitterX,
    y:
      node.sourceType === "external-citing"
        ? -210 + ((index % 11) - 5) * 26 + jitterY
        : -70 + (band - 1.5) * 115 + wave + jitterY
  };
}

export function CitationNetworkExplorer({ data }: { data: CitationNetworkData }) {
  const router = useRouter();
  const [year, setYear] = useState(2022);
  const [timeMode, setTimeMode] = useState<"year" | "through">("through");

  const visibleNodes = useMemo(
    () =>
      data.nodes.filter((node) =>
        timeMode === "through" ? node.publicationYear <= year : node.publicationYear === year
      ),
    [data.nodes, timeMode, year]
  );

  const summary = useMemo(() => {
    const yearNodes = data.nodes.filter(
      (node) => node.publicationYear === year && node.sourceType === "target-journal"
    );
    const externalNodes = visibleNodes.filter((node) => node.sourceType === "external-citing");
    const gssCitations = yearNodes
      .filter((node) => node.articleCategory === "Guideline / Statement / Statistics")
      .reduce((sum, node) => sum + node.twoYearCitationCount, 0);
    const total = yearNodes.reduce((sum, node) => sum + node.twoYearCitationCount, 0);

    return {
      articles: yearNodes.length,
      external: externalNodes.length,
      gssShare: percent(gssCitations, total)
    };
  }, [data.nodes, visibleNodes, year]);

  const option = useMemo<EChartsOption>(() => {
    const visibleIds = new Set(visibleNodes.map((node) => node.id));
    const edges = data.edges.filter(
      (edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target)
    );

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        formatter: (params: unknown) => {
          const payload = Array.isArray(params) ? params[0] : params;
          const item = (payload as {
            data?: CitationNetworkNode;
          }).data;
          if (!item?.title) {
            return "";
          }

          const label =
            item.sourceType === "external-citing"
              ? `External citing literature<br/>Linked target: ${item.targetArticleId}`
              : `${item.articleCategory}<br/>2-year citations: ${item.twoYearCitationCount}`;

          return `<strong>${item.title}</strong><br/>${item.journal}<br/>${item.publicationYear}<br/>${label}`;
        }
      },
      legend: {
        show: false
      },
      series: [
        {
          type: "graph",
          layout: "none",
          roam: true,
          draggable: true,
          categories: [
            ...Object.keys(targetJournalColors).map((journal) => ({ name: journal })),
            { name: "External citing literature" }
          ],
          animation: false,
          progressive: 800,
          progressiveThreshold: 1200,
          lineStyle: {
            color: "rgba(95,99,104,0.16)",
            opacity: 0.48,
            width: 0.65,
            curveness: 0.1
          },
          emphasis: {
            focus: "adjacency",
            scale: 1.5,
            lineStyle: {
              opacity: 0.6,
              width: 1.6
            }
          },
          data: visibleNodes.map((node, index) => ({
            ...node,
            ...nodePosition(node, index),
            name: node.sourceType === "external-citing" ? "" : node.id,
            category:
              node.sourceType === "external-citing"
                ? "External citing literature"
                : node.journal,
            symbol: categorySymbols[node.articleCategory] ?? "circle",
            symbolSize:
              node.sourceType === "external-citing"
                ? Math.max(5, Math.min(22, 5 + Math.sqrt(node.twoYearCitationCount) * 1.55))
                : Math.max(9, Math.min(58, 9 + Math.sqrt(node.twoYearCitationCount) * 2.75)),
            itemStyle: {
              color: nodeColor(node),
              borderColor: node.sourceType === "external-citing" ? "rgba(124,77,255,0.34)" : "rgba(255,255,255,0.74)",
              borderWidth: node.sourceType === "external-citing" ? 0.7 : 1.2,
              opacity: node.sourceType === "external-citing" ? 0.42 : 0.62
            }
          })),
          links: edges
        }
      ]
    };
  }, [data.edges, visibleNodes]);

  return (
    <section className="absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,253,0.78)),radial-gradient(circle_at_50%_50%,rgba(26,115,232,0.12),transparent_34rem)] dark:bg-[linear-gradient(180deg,rgba(17,19,24,0.92),rgba(17,19,24,0.78)),radial-gradient(circle_at_50%_50%,rgba(26,115,232,0.16),transparent_34rem)]">
      <div className="absolute left-4 top-4 z-10 flex max-w-[calc(100vw-8rem)] flex-wrap gap-2 text-xs font-semibold text-journal-slate sm:left-6 sm:top-6">
        {Object.entries(targetJournalColors).map(([journal, color]) => (
          <span key={journal} className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 shadow-hairline backdrop-blur dark:bg-white/10">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {shortJournal(journal)}
          </span>
        ))}
        <span className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 shadow-hairline backdrop-blur dark:bg-white/10">
          <span className="h-2 w-2 rounded-full bg-[#7C4DFF]" />
          Outside citing literature
        </span>
      </div>

      <div className="absolute right-4 top-4 z-10 hidden flex-wrap justify-end gap-2 text-xs font-semibold text-journal-slate sm:right-6 sm:top-6 lg:flex">
        <span className="rounded-full bg-white/70 px-3 py-1.5 shadow-hairline backdrop-blur dark:bg-white/10">
          {year}: {summary.articles} target articles
        </span>
        <span className="rounded-full bg-white/70 px-3 py-1.5 shadow-hairline backdrop-blur dark:bg-white/10">
          {summary.external} outside citing nodes
        </span>
        <span className="rounded-full bg-white/70 px-3 py-1.5 shadow-hairline backdrop-blur dark:bg-white/10">
          GSS share {summary.gssShare}%
        </span>
      </div>

      <EChart
        option={option}
        height={typeof window === "undefined" ? 760 : window.innerHeight}
        onEvents={{
          click: (params: { data?: { id?: string; sourceType?: string; targetArticleId?: string } }) => {
            const targetId =
              params.data?.sourceType === "external-citing"
                ? params.data.targetArticleId
                : params.data?.id;
            if (targetId) {
              document.dispatchEvent(new Event("clear-card:navigate"));
              router.push(`/articles/${targetId}`);
            }
          }
        }}
      />

      <div className="absolute inset-x-4 bottom-4 z-10 rounded-full bg-white/82 px-4 py-3 shadow-[0_12px_40px_rgba(60,64,67,0.16)] backdrop-blur-xl dark:bg-white/10 sm:inset-x-8">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <input
              type="range"
              min={2008}
              max={2022}
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="w-full accent-journal-blue"
            />
            <div className="mt-1 flex justify-between text-xs font-semibold text-journal-muted">
              <span>2008</span>
              <span>Publication year {year}</span>
              <span>2022</span>
            </div>
          </div>
          <div className="flex rounded-full bg-journal-surface p-1 text-sm font-semibold dark:bg-black/20">
            {(["through", "year"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTimeMode(mode)}
                className={`rounded-full px-4 py-2 capitalize transition ${
                  timeMode === mode
                    ? "bg-journal-control text-journal-control-ink shadow-[0_8px_20px_rgba(60,64,67,0.18)]"
                    : "text-journal-slate hover:bg-white/70"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
