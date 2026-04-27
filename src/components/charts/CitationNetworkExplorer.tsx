"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { EChartsOption } from "echarts";
import type { CitationNetworkData, CitationNetworkNode, Journal } from "@/types/bibliometric";
import { EChart } from "./EChartCard";

const journalColors: Record<Journal, string> = {
  "Journal of the American College of Cardiology": "#1F5D8C",
  Circulation: "#A22A2F",
  "European Heart Journal": "#397C7A",
  "JAMA Cardiology": "#A67C2D"
};

const categorySymbols: Record<string, string> = {
  "Original Research": "circle",
  Review: "rect",
  "Meta-analysis": "diamond",
  "Guideline / Statement / Statistics": "roundRect",
  Editorial: "triangle",
  "Other Non-original": "pin"
};

function matchesQuery(node: CitationNetworkNode, queryText: string) {
  return (
    !queryText ||
    node.title.toLowerCase().includes(queryText) ||
    node.journal.toLowerCase().includes(queryText) ||
    node.articleCategory.toLowerCase().includes(queryText)
  );
}

function percent(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

export function CitationNetworkExplorer({ data }: { data: CitationNetworkData }) {
  const router = useRouter();
  const [year, setYear] = useState(2022);
  const [query, setQuery] = useState("");
  const [timeMode, setTimeMode] = useState<"year" | "through">("through");
  const queryText = query.trim().toLowerCase();

  const currentYearNodes = useMemo(
    () =>
      data.nodes.filter(
        (node) => node.publicationYear === year && matchesQuery(node, queryText)
      ),
    [data.nodes, queryText, year]
  );
  const visibleNodes = useMemo(
    () =>
      data.nodes.filter((node) => {
        const matchesYear =
          timeMode === "through" ? node.publicationYear <= year : node.publicationYear === year;
        return matchesYear && matchesQuery(node, queryText);
      }),
    [data.nodes, queryText, timeMode, year]
  );

  const stats = useMemo(() => {
    const totalTwoYear = currentYearNodes.reduce(
      (sum, node) => sum + node.twoYearCitationCount,
      0
    );
    const oraCount = currentYearNodes.filter(
      (node) => node.articleCategory === "Original Research"
    ).length;
    const gssCitations = currentYearNodes
      .filter((node) => node.articleCategory === "Guideline / Statement / Statistics")
      .reduce((sum, node) => sum + node.twoYearCitationCount, 0);

    return {
      articleCount: currentYearNodes.length,
      oraShare: percent(oraCount, currentYearNodes.length),
      gssCitationShare: percent(gssCitations, totalTwoYear),
      twoYearCitationCount: totalTwoYear
    };
  }, [currentYearNodes]);

  const journalBars = useMemo(
    () =>
      Object.keys(journalColors).map((journal) => {
        const nodes = currentYearNodes.filter((node) => node.journal === journal);
        const total = nodes.reduce((sum, node) => sum + node.twoYearCitationCount, 0);
        return {
          journal: journal as Journal,
          count: nodes.length,
          total
        };
      }),
    [currentYearNodes]
  );

  const option = useMemo<EChartsOption>(() => {
    const visibleIds = new Set(visibleNodes.map((node) => node.id));
    const edges = data.edges.filter(
      (edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target)
    );

    return {
      tooltip: {
        trigger: "item",
        formatter: (params: unknown) => {
          const payload = Array.isArray(params) ? params[0] : params;
          const item = (payload as {
            data?: {
              title?: string;
              journal?: string;
              twoYearCitationCount?: number;
              totalCitationCount?: number;
              articleCategory?: string;
              publicationYear?: number;
            };
          }).data;
          if (!item?.title) {
            return "";
          }
          return `<strong>${item.title}</strong><br/>${item.journal}<br/>${item.publicationYear} · ${item.articleCategory}<br/>2-year citations: ${item.twoYearCitationCount}<br/>Total citations: ${item.totalCitationCount}`;
        }
      },
      legend: {
        show: true,
        bottom: 0,
        type: "scroll",
        textStyle: {
          color: "#6B7A90"
        }
      },
      series: [
        {
          type: "graph",
          layout: "force",
          roam: true,
          draggable: true,
          categories: Object.keys(journalColors).map((journal) => ({ name: journal })),
          force: {
            repulsion: 72,
            edgeLength: [18, 74],
            friction: 0.22,
            gravity: 0.08
          },
          animationDuration: 900,
          animationDurationUpdate: 950,
          animationEasingUpdate: "elasticOut",
          lineStyle: {
            color: "source",
            opacity: 0.1,
            width: 0.7,
            curveness: 0.08
          },
          emphasis: {
            focus: "adjacency",
            scale: 1.45,
            lineStyle: {
              opacity: 0.52,
              width: 1.5
            }
          },
          data: visibleNodes.map((node) => ({
            id: node.id,
            name: node.id,
            title: node.title,
            journal: node.journal,
            publicationYear: node.publicationYear,
            articleCategory: node.articleCategory,
            totalCitationCount: node.totalCitationCount,
            twoYearCitationCount: node.twoYearCitationCount,
            category: node.journal,
            symbol: categorySymbols[node.articleCategory] ?? "circle",
            symbolSize: Math.max(7, Math.min(52, 7 + Math.sqrt(node.twoYearCitationCount) * 2.55)),
            itemStyle: {
              color: journalColors[node.journal],
              opacity: node.classification === "ORA" ? 0.78 : 0.96
            }
          })),
          links: edges
        }
      ]
    };
  }, [data.edges, visibleNodes]);

  return (
    <section className="network-stage animate-soft-rise overflow-hidden border border-journal-line bg-[color:var(--card-bg)] shadow-hairline backdrop-blur-xl">
      <div className="grid gap-4 border-b border-journal-line p-4 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
        <div>
          <p className="metadata-label">Evolving citation network</p>
          <h2 className="mt-1 text-3xl font-semibold leading-tight text-journal-ink">
            Cardiovascular citation flow by journal, year, and article category
          </h2>
        </div>
        <div className="grid gap-3">
          <label className="block">
            <span className="metadata-label">Search network</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Article, journal, category"
              className="mt-1 w-full border border-journal-line bg-white/80 px-3 py-3 text-base text-journal-ink outline-none transition focus:border-journal-blue focus:ring-2 focus:ring-journal-blue/20 dark:bg-white/5"
            />
          </label>
          <div className="flex border border-journal-line bg-white/70 p-0.5 text-sm font-semibold dark:bg-white/5">
            {(["through", "year"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTimeMode(mode)}
                className={`flex-1 px-3 py-2 capitalize transition ${
                  timeMode === mode
                    ? "bg-journal-navy text-white"
                    : "text-journal-slate hover:bg-journal-surface"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-b border-journal-line p-4 sm:grid-cols-2 xl:grid-cols-4">
        <NetworkMetric label={`${year} articles`} value={stats.articleCount.toLocaleString()} />
        <NetworkMetric label="ORA publication share" value={`${stats.oraShare}%`} />
        <NetworkMetric label="GSS 2-year citation share" value={`${stats.gssCitationShare}%`} />
        <NetworkMetric label="2-year citations" value={stats.twoYearCitationCount.toLocaleString()} />
      </div>

      <div className="p-3">
        <EChart
          option={option}
          height={620}
          onEvents={{
            click: (params: { data?: { id?: string } }) => {
              if (params.data?.id) {
                router.push(`/articles/${params.data.id}`);
              }
            }
          }}
        />
        <div className="grid gap-3 px-1 pb-2 pt-3 lg:grid-cols-[1fr_360px] lg:items-center">
          <div>
            <input
              type="range"
              min={2008}
              max={2022}
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="w-full accent-journal-crimson"
            />
            <div className="mt-1 flex justify-between text-xs font-semibold text-journal-muted">
              <span>2008</span>
              <span>Publication year {year}</span>
              <span>2022</span>
            </div>
          </div>
          <div className="grid gap-1.5">
            {journalBars.map((item) => {
              const maxTotal = Math.max(...journalBars.map((bar) => bar.total), 1);
              return (
                <div key={item.journal} className="grid grid-cols-[86px_1fr_48px] items-center gap-2 text-xs">
                  <span className="truncate font-semibold text-journal-slate">
                    {item.journal === "Journal of the American College of Cardiology"
                      ? "JACC"
                      : item.journal === "European Heart Journal"
                        ? "EHJ"
                        : item.journal === "JAMA Cardiology"
                          ? "JAMA"
                          : "CIRC"}
                  </span>
                  <span className="h-2 bg-journal-line">
                    <span
                      className="block h-2 transition-all duration-500"
                      style={{
                        width: `${percent(item.total, maxTotal)}%`,
                        backgroundColor: journalColors[item.journal]
                      }}
                    />
                  </span>
                  <span className="text-right tabular-nums text-journal-muted">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function NetworkMetric({ label, value }: { label: string; value: string }) {
  return (
    <article className="interactive-lift border border-journal-line bg-white/75 px-4 py-3 dark:bg-white/5">
      <p className="metadata-label">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-journal-ink">{value}</p>
    </article>
  );
}
