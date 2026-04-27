"use client";

import { useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import { formatInteger } from "@/lib/format";
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

const journalColors: Record<string, string> = {
  CIRC: "#A22A2F",
  EHJ: "#397C7A",
  JACC: "#1F5D8C",
  "JAMA CARDIOL": "#A67C2D"
};

const resultFamilies = [
  { id: "impact", label: "Impact", tableNumbers: [1, 2, 3, 4, 5, 18] },
  { id: "composition", label: "Composition", tableNumbers: [6, 7, 8, 9] },
  { id: "quality", label: "Citation Quality", tableNumbers: [10, 11, 12, 13, 14, 15, 16, 17] }
] as const;

const chartModes: { id: ChartMode; label: string }[] = [
  { id: "time", label: "Trajectory" },
  { id: "heatmap", label: "Heatmap" },
  { id: "composition", label: "Composition" },
  { id: "association", label: "JIF Association" }
];

function getCellValue(cell: ResearchCell | undefined, mode: ValueMode) {
  if (!cell) {
    return null;
  }

  if (mode === "secondary") {
    return cell.secondaryValue ?? cell.value;
  }

  return cell.value;
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

function findJifRecord(
  jifTable: ResearchTable | undefined,
  journalCode: string,
  year: number,
  metric: string
) {
  return jifTable?.records.find(
    (record) => record.journalCode === journalCode && record.year === year
  )?.values[metric]?.value ?? null;
}

function familyForTable(tableNumber: number) {
  return (
    resultFamilies.find((family) =>
      (family.tableNumbers as readonly number[]).includes(tableNumber)
    ) ??
    resultFamilies[0]
  );
}

function figureNumber(figure: MainFigureLegend) {
  const match = figure.title.match(/(?:Supplemental )?Figure\s+(\d+)/);
  return match?.[1] ?? "";
}

function makeOption({
  table,
  activeColumn,
  chartMode,
  valueMode,
  selectedJournal,
  selectedYear,
  jifTable,
  baselineMetric
}: {
  table: ResearchTable;
  activeColumn: string;
  chartMode: ChartMode;
  valueMode: ValueMode;
  selectedJournal: string;
  selectedYear: number;
  jifTable?: ResearchTable;
  baselineMetric: string;
}): EChartsOption {
  const years = uniqueSorted(table.records.map((record) => record.year));
  const journals = uniqueSorted(table.records.map((record) => record.journalCode));
  const axis = { axisLabel: { color: "#6B7A90" } };
  const grid = { top: 54, left: 56, right: 26, bottom: 54 };

  if (chartMode === "heatmap") {
    const values = table.records
      .map((record) => getCellValue(record.values[activeColumn], valueMode))
      .filter((value): value is number => typeof value === "number");
    const max = Math.max(...values, 1);

    return {
      tooltip: {
        trigger: "item",
        formatter: (params: unknown) => {
          const item = params as { data?: [number, number, number | null] };
          if (!item.data) {
            return "";
          }
          const [xIndex, yIndex, value] = item.data;
          return `${journals[yIndex]} ${years[xIndex]}<br/>${activeColumn}: ${
            value === null ? "NA" : value.toLocaleString()
          }`;
        }
      },
      grid,
      xAxis: { type: "category", data: years.map(String), ...axis },
      yAxis: { type: "category", data: journals, ...axis },
      visualMap: {
        min: 0,
        max,
        orient: "horizontal",
        left: "center",
        bottom: 6,
        calculable: true,
        inRange: { color: ["#EAF2F8", "#6FA7BF", "#A22A2F"] },
        textStyle: { color: "#6B7A90" }
      },
      series: [
        {
          type: "heatmap",
          data: journals.flatMap((journal, yIndex) =>
            years.map((year, xIndex) => [
              xIndex,
              yIndex,
              getRecordValue(table.records, journal, year, activeColumn, valueMode)
            ])
          ),
          emphasis: {
            itemStyle: {
              borderColor: "#101828",
              borderWidth: 1
            }
          }
        }
      ]
    };
  }

  if (chartMode === "composition") {
    const columns = table.columns;
    const journal =
      journals.includes(selectedJournal) ? selectedJournal : (journals[0] ?? selectedJournal);

    return {
      tooltip: {
        trigger: "axis",
        valueFormatter: (value) =>
          typeof value === "number" ? value.toLocaleString() : String(value)
      },
      legend: { top: 0, type: "scroll", textStyle: { color: "#6B7A90" } },
      grid,
      xAxis: { type: "category", data: years.map(String), ...axis },
      yAxis: { type: "value", ...axis, splitLine: { lineStyle: { color: "#D8DEE8" } } },
      series: columns.map((column) => ({
        name: column,
        type: "line",
        smooth: true,
        stack: "result-share",
        areaStyle: { opacity: 0.18 },
        symbolSize: 5,
        emphasis: { focus: "series" },
        data: years.map((year) =>
          getRecordValue(table.records, journal, year, column, valueMode)
        )
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
          return `${item.seriesName} ${year}<br/>${baselineMetric}: ${xValue.toLocaleString()}<br/>${activeColumn}: ${yValue.toLocaleString()}<br/>${raw}`;
        }
      },
      legend: { top: 0, textStyle: { color: "#6B7A90" } },
      grid,
      xAxis: {
        type: "value",
        name: baselineMetric,
        nameTextStyle: { color: "#6B7A90" },
        ...axis,
        splitLine: { lineStyle: { color: "#D8DEE8" } }
      },
      yAxis: {
        type: "value",
        name: activeColumn,
        nameTextStyle: { color: "#6B7A90" },
        ...axis,
        splitLine: { lineStyle: { color: "#D8DEE8" } }
      },
      series: journals.map((journal) => ({
        name: journal,
        type: "scatter",
        symbolSize: (value: unknown) => {
          const point = value as [number, number];
          return Math.max(8, Math.min(28, 8 + Math.sqrt(Math.max(point[1], 0))));
        },
        itemStyle: { color: journalColors[journal] },
        emphasis: { focus: "series", scale: 1.35 },
        data: table.records
          .filter((record) => record.journalCode === journal)
          .map((record) => {
            const x = findJifRecord(jifTable, journal, record.year + 2, baselineMetric);
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
    legend: { top: 0, textStyle: { color: "#6B7A90" } },
    grid,
    xAxis: { type: "category", data: years.map(String), ...axis },
    yAxis: { type: "value", ...axis, splitLine: { lineStyle: { color: "#D8DEE8" } } },
    series: journals.map((journal) => ({
      name: journal,
      type: "line",
      smooth: true,
      symbolSize: (value: unknown) => {
        const numberValue = Number(value);
        return Number.isFinite(numberValue) && selectedYear
          ? Math.max(5, Math.min(12, 5 + Math.sqrt(Math.max(numberValue, 0)) / 5))
          : 6;
      },
      lineStyle: { width: 3, color: journalColors[journal] },
      itemStyle: { color: journalColors[journal] },
      emphasis: { focus: "series", scale: 1.3 },
      markLine:
        selectedYear && years.includes(selectedYear)
          ? {
              symbol: "none",
              label: { formatter: String(selectedYear) },
              lineStyle: { color: "#A67C2D", type: "dashed" },
              data: [{ xAxis: String(selectedYear) }]
            }
          : undefined,
      data: years.map((year) =>
        getRecordValue(table.records, journal, year, activeColumn, valueMode)
      )
    }))
  };
}

export function ResultsAtlas({ dataset }: { dataset: ResearchResultsDataset }) {
  const defaultTable =
    dataset.supplementalTables.find((table) => table.number === 8) ??
    dataset.supplementalTables[0];
  const [familyId, setFamilyId] = useState<(typeof resultFamilies)[number]["id"]>(
    "composition"
  );
  const [tableId, setTableId] = useState(defaultTable?.id ?? "");
  const [column, setColumn] = useState(defaultTable?.columns[0] ?? "");
  const [chartMode, setChartMode] = useState<ChartMode>("time");
  const [valueMode, setValueMode] = useState<ValueMode>("value");
  const [selectedJournal, setSelectedJournal] = useState("CIRC");
  const [baselineMetric, setBaselineMetric] = useState("JIF");
  const [figureQuery, setFigureQuery] = useState("");

  const hasTables = dataset.supplementalTables.length > 0;
  const activeFamily =
    resultFamilies.find((family) => family.id === familyId) ?? resultFamilies[0];
  const familyTables = dataset.supplementalTables.filter((table) =>
    (activeFamily.tableNumbers as readonly number[]).includes(table.number)
  );
  const table =
    dataset.supplementalTables.find((candidate) => candidate.id === tableId) ??
    defaultTable;
  const activeColumn = table?.columns.includes(column) ? column : table?.columns[0] ?? "";
  const journals = table ? uniqueSorted(table.records.map((record) => record.journalCode)) : [];
  const years = table ? uniqueSorted(table.records.map((record) => record.year)) : [];
  const selectedYear = years[years.length - 1] ?? 2022;
  const jifTable = dataset.supplementalTables.find((candidate) => candidate.number === 1);
  const allFigures = [...dataset.mainFigures, ...(dataset.supplementalFigures ?? [])];
  const visibleFigures = allFigures.filter((figure) => {
    const query = figureQuery.trim().toLowerCase();
    return (
      !query ||
      figure.title.toLowerCase().includes(query) ||
      figure.legend.toLowerCase().includes(query)
    );
  });
  const hasSecondary = table?.records.some(
    (record) => record.values[activeColumn]?.secondaryValue !== null
  );
  const totalCells = dataset.supplementalTables.reduce(
    (sum, candidate) => sum + candidate.records.length * candidate.columns.length,
    0
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
      selectedYear,
      jifTable,
      baselineMetric
    });
  }, [
    activeColumn,
    baselineMetric,
    chartMode,
    jifTable,
    selectedJournal,
    selectedYear,
    table,
    valueMode
  ]);

  if (!hasTables || !table) {
    return (
      <div className="academic-card px-4 py-8 text-center text-sm text-journal-muted">
        No manuscript result tables were extracted.
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="result-hero animate-gentle-pop overflow-hidden border border-journal-line bg-[color:var(--card-bg)] p-5 backdrop-blur-xl">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
          <div>
            <p className="metadata-label">Manuscript results converted to an atlas</p>
            <h2 className="gradient-title mt-2 text-4xl font-semibold leading-tight sm:text-5xl">
              Every supplemental table becomes an explorable chart surface.
            </h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {dataset.narrativeFindings.map((finding) => (
                <article
                  key={finding}
                  className="interactive-lift border border-journal-line bg-white/70 px-4 py-3 text-sm leading-6 text-journal-slate shadow-hairline dark:bg-white/5"
                >
                  {finding}
                </article>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AtlasMetric label="Tables" value={dataset.supplementalTables.length} />
            <AtlasMetric label="Records" value={dataset.supplementalTables.reduce((sum, candidate) => sum + candidate.records.length, 0)} />
            <AtlasMetric label="Cells" value={totalCells} />
            <AtlasMetric label="Figures" value={allFigures.length} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="academic-card animate-soft-rise overflow-hidden">
          <div className="border-b border-journal-line p-4">
            <p className="metadata-label">Result family</p>
            <div className="mt-3 grid gap-2">
              {resultFamilies.map((family) => (
                <button
                  key={family.id}
                  type="button"
                  onClick={() => {
                    const nextTable = dataset.supplementalTables.find((candidate) =>
                      (family.tableNumbers as readonly number[]).includes(candidate.number)
                    );
                    setFamilyId(family.id);
                    if (nextTable) {
                      setTableId(nextTable.id);
                      setColumn(nextTable.columns[0] ?? "");
                    }
                  }}
                  className={`interactive-lift flex items-center justify-between border px-3 py-3 text-left text-sm font-semibold transition ${
                    family.id === familyId
                      ? "border-journal-blue bg-blue-50 text-journal-blue dark:bg-blue-400/10"
                      : "border-journal-line bg-white/70 text-journal-slate hover:border-journal-blue/50 dark:bg-white/5"
                  }`}
                >
                  <span>{family.label}</span>
                  <span className="text-xs text-journal-muted">
                    {family.tableNumbers.length}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[560px] overflow-auto p-3">
            {familyTables.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                onClick={() => {
                  setTableId(candidate.id);
                  setColumn(candidate.columns[0] ?? "");
                }}
                className={`mb-2 block w-full border px-3 py-3 text-left transition ${
                  candidate.id === table.id
                    ? "border-journal-crimson bg-red-50/80 dark:bg-red-400/10"
                    : "border-journal-line bg-white/70 hover:border-journal-blue/50 dark:bg-white/5"
                }`}
              >
                <span className="metadata-label">Table {candidate.number}</span>
                <span className="mt-1 block text-sm font-semibold leading-5 text-journal-ink">
                  {candidate.title}
                </span>
                <span className="mt-2 block text-xs text-journal-muted">
                  {candidate.records.length} journal-year rows · {candidate.columns.length} metrics
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="academic-card animate-soft-rise overflow-hidden">
          <div className="border-b border-journal-line p-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <div>
                <p className="metadata-label">
                  {familyForTable(table.number).label} · Supplemental Table {table.number}
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-journal-ink">
                  {table.title}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {chartModes.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setChartMode(mode.id)}
                    className={`border px-3 py-2 text-sm font-semibold transition ${
                      chartMode === mode.id
                        ? "border-journal-navy bg-journal-navy text-white"
                        : "border-journal-line bg-white/70 text-journal-slate hover:border-journal-blue dark:bg-white/5"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SelectControl
                label="Metric"
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
                label="Association x-axis"
                value={baselineMetric}
                onChange={(nextValue) => setBaselineMetric(nextValue)}
                options={jifTable?.columns ?? ["JIF"]}
              />
            </div>
          </div>

          <div className="p-4">
            <EChart option={option} height={540} />
          </div>
        </section>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="academic-card overflow-hidden">
          <div className="border-b border-journal-line px-4 py-3">
            <p className="metadata-label">Parsed table records</p>
            <h2 className="text-lg font-semibold text-journal-ink">{table.sourceLabel}</h2>
          </div>
          <div className="max-h-[520px] overflow-auto">
            <table className="min-w-full divide-y divide-journal-line text-sm">
              <thead className="sticky top-0 bg-journal-surface text-left text-xs uppercase text-journal-muted">
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
              <tbody className="divide-y divide-journal-line bg-white/70 dark:bg-white/[0.03]">
                {table.records.map((record) => (
                  <tr
                    key={`${record.journalCode}-${record.year}`}
                    className="transition hover:bg-journal-surface/80"
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

        <aside className="academic-card overflow-hidden">
          <div className="border-b border-journal-line p-4">
            <p className="metadata-label">Figure library</p>
            <input
              value={figureQuery}
              onChange={(event) => setFigureQuery(event.target.value)}
              placeholder="Search figures"
              className="mt-2 w-full border border-journal-line bg-white/80 px-3 py-2 text-sm text-journal-ink outline-none transition focus:border-journal-blue focus:ring-2 focus:ring-journal-blue/20 dark:bg-white/5"
            />
          </div>
          <div className="max-h-[520px] overflow-auto divide-y divide-journal-line">
            {visibleFigures.map((figure) => (
              <article key={figure.id} className="interactive-lift px-4 py-3">
                <p className="metadata-label">Figure {figureNumber(figure)}</p>
                <h3 className="mt-1 text-sm font-semibold leading-5 text-journal-ink">
                  {figure.title.replace(/^Supplemental Figure \d+\. |^Figure \d+\. /, "")}
                </h3>
                <p className="mt-2 text-xs leading-5 text-journal-muted">
                  {figure.legend}
                </p>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}

function AtlasMetric({ label, value }: { label: string; value: number }) {
  return (
    <article className="border border-journal-line bg-white/75 px-4 py-3 shadow-hairline dark:bg-white/5">
      <p className="metadata-label">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-journal-ink">
        {formatInteger(value)}
      </p>
    </article>
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
        className="mt-1 w-full border border-journal-line bg-white/85 px-3 py-2.5 text-sm text-journal-ink outline-none transition focus:border-journal-blue focus:ring-2 focus:ring-journal-blue/20 dark:bg-white/5"
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
