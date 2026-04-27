import Link from "next/link";
import {
  DATASET_SNAPSHOTS,
  DATASET_SOURCES
} from "@/types/bibliometric";
import type {
  DatasetSnapshot,
  DatasetSource,
  ArticleCategory,
  ArticleClassification,
  ArticleSearchFilters,
  ArticleSort,
  ArticleType,
  Journal
} from "@/types/bibliometric";

const sortOptions: { value: ArticleSort; label: string }[] = [
  { value: "publicationYearDesc", label: "Publication year descending" },
  { value: "totalCitationsDesc", label: "Total citation count descending" },
  { value: "twoYearCitationsDesc", label: "2-year citation count descending" },
  { value: "fitnessDesc", label: "Fitness descending" },
  { value: "titleAsc", label: "Title ascending" }
];

const classificationOptions: ArticleClassification[] = ["ORA", "NORA"];
const datasetOptions = ["Scopus", "iCite"] as const;
const snapshotOptions: readonly DatasetSnapshot[] = DATASET_SNAPSHOTS;
const indexedInOptions: readonly DatasetSource[] = DATASET_SOURCES;

export function FilterPanel({
  filters,
  journals,
  articleTypes,
  articleCategories
}: {
  filters: ArticleSearchFilters;
  journals: Journal[];
  articleTypes: ArticleType[];
  articleCategories: ArticleCategory[];
}) {
  return (
    <form className="academic-card mb-5 grid animate-soft-rise gap-4 p-4" action="/articles">
      <div>
        <label className="metadata-label" htmlFor="q">
          Search
        </label>
        <input
          id="q"
          name="q"
          defaultValue={filters.query ?? ""}
          placeholder="Title, abstract, DOI, author, or keyword"
          className="mt-1 w-full border border-journal-line bg-white/85 px-3 py-3 text-base text-journal-ink outline-none transition focus:border-journal-blue focus:ring-2 focus:ring-journal-blue/20 dark:bg-white/5"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <SelectField label="Journal" name="journal" value={filters.journal} options={journals} />
        <SelectField
          label="Category"
          name="articleCategory"
          value={filters.articleCategory}
          options={articleCategories}
        />
        <SelectField
          label="Article type"
          name="articleType"
          value={filters.articleType}
          options={articleTypes}
        />
        <SelectField
          label="ORA/NORA"
          name="classification"
          value={filters.classification}
          options={classificationOptions}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <NumberField label="Year from" name="yearFrom" value={filters.yearFrom} />
        <NumberField label="Year to" name="yearTo" value={filters.yearTo} />
        <SelectField
          label="Citation dataset"
          name="dataset"
          value={filters.dataset ?? "Scopus"}
          options={datasetOptions}
        />
        <SelectField
          label="Snapshot"
          name="snapshot"
          value={filters.snapshot}
          options={snapshotOptions}
        />
        <SelectField
          label="Indexed in"
          name="indexedIn"
          value={filters.indexedIn}
          options={indexedInOptions}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
        <SelectField
          label="Sort"
          name="sort"
          value={filters.sort ?? "publicationYearDesc"}
          options={sortOptions.map((option) => option.value)}
          labels={Object.fromEntries(
            sortOptions.map((option) => [option.value, option.label])
          )}
        />
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="border border-journal-navy bg-journal-navy px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#102D52]"
          >
            Apply
          </button>
          <Link
            href="/articles"
            className="border border-journal-line bg-white/85 px-4 py-3 text-sm font-semibold text-journal-slate transition hover:-translate-y-0.5 hover:border-journal-slate dark:bg-white/5"
          >
            Reset
          </Link>
        </div>
      </div>
    </form>
  );
}

function SelectField<T extends string>({
  label,
  name,
  value,
  options,
  labels
}: {
  label: string;
  name: string;
  value?: T;
  options: readonly T[];
  labels?: Record<string, string>;
}) {
  return (
    <label className="block">
      <span className="metadata-label">{label}</span>
      <select
        name={name}
        defaultValue={value ?? ""}
        className="mt-1 w-full border border-journal-line bg-white/85 px-3 py-3 text-sm text-journal-ink outline-none transition focus:border-journal-blue focus:ring-2 focus:ring-journal-blue/20 dark:bg-white/5"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({
  label,
  name,
  value
}: {
  label: string;
  name: string;
  value?: number;
}) {
  return (
    <label className="block">
      <span className="metadata-label">{label}</span>
      <input
        name={name}
        type="number"
        min={2008}
        max={2022}
        defaultValue={value ?? ""}
        className="mt-1 w-full border border-journal-line bg-white/85 px-3 py-3 text-sm text-journal-ink outline-none transition focus:border-journal-blue focus:ring-2 focus:ring-journal-blue/20 dark:bg-white/5"
      />
    </label>
  );
}
