"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
const filterPages = ["Search", "Scope", "Types", "Sources", "Sort"] as const;

function countSelected(filters: ArticleSearchFilters) {
  return [
    filters.query,
    filters.yearFrom,
    filters.yearTo,
    ...(filters.journal ?? []),
    ...(filters.articleCategory ?? []),
    ...(filters.articleType ?? []),
    ...(filters.classification ?? []),
    filters.dataset,
    ...(filters.snapshot ?? []),
    ...(filters.indexedIn ?? []),
    filters.sort
  ].filter(Boolean).length;
}

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
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeCount = countSelected(filters);

  useEffect(() => {
    setMounted(true);
  }, []);

  const openDialog = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    setClosing(false);
    setOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    setClosing(true);
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 220);
  }, []);

  useEffect(
    () => () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDialog();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [closeDialog, open]);

  return (
    <div className="mb-5 animate-soft-rise">
      <div className="flex flex-col gap-3 rounded-[28px] bg-white/72 p-3 shadow-[0_18px_54px_rgba(60,64,67,0.10)] backdrop-blur-xl dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={openDialog}
          className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-journal-ink px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(60,64,67,0.18)] transition hover:-translate-y-0.5"
        >
          <FilterIcon />
          Search and filters
        </button>
        <div className="min-w-0 text-sm text-journal-muted sm:text-right">
          <span className="font-semibold text-journal-ink">
            {activeCount > 0 ? `${activeCount} active setting${activeCount === 1 ? "" : "s"}` : "All articles"}
          </span>
          {filters.query ? (
            <span className="ml-2 truncate">Search: {filters.query}</span>
          ) : null}
        </div>
      </div>

      {mounted && open
        ? createPortal(
            <FilterDialog
              filters={filters}
              journals={journals}
              articleTypes={articleTypes}
              articleCategories={articleCategories}
              closing={closing}
              onClose={closeDialog}
            />,
            document.body
          )
        : null}
    </div>
  );
}

function FilterDialog({
  filters,
  journals,
  articleTypes,
  articleCategories,
  closing,
  onClose
}: {
  filters: ArticleSearchFilters;
  journals: Journal[];
  articleTypes: ArticleType[];
  articleCategories: ArticleCategory[];
  closing: boolean;
  onClose: () => void;
}) {
  const [page, setPage] = useState(0);
  const firstPage = page === 0;
  const lastPage = page === filterPages.length - 1;

  return (
    <div
      className={`fixed inset-0 z-[1000] flex min-h-dvh items-center justify-center overflow-hidden bg-white/60 p-3 backdrop-blur-xl dark:bg-black/50 sm:p-6 ${
        closing ? "animate-modal-fade-out" : "animate-modal-fade-in"
      }`}
    >
      <button
        type="button"
        aria-label="Close filters"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="article-filter-title"
        className={`relative z-10 flex h-[min(760px,calc(100dvh-1.5rem))] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] bg-[color:var(--card-bg)] shadow-[0_32px_90px_rgba(60,64,67,0.30)] backdrop-blur-2xl sm:h-[min(760px,calc(100dvh-3rem))] ${
          closing ? "animate-modal-panel-out" : "animate-modal-panel-in"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-journal-line/70 px-4 py-3 sm:px-5">
          <div>
            <p className="metadata-label">Article explorer</p>
            <h2 id="article-filter-title" className="text-xl font-semibold text-journal-ink">
              Search and filters
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="group grid h-11 w-11 place-items-center rounded-full bg-white/84 text-journal-slate shadow-[0_8px_22px_rgba(60,64,67,0.12)] ring-1 ring-journal-line/80 transition duration-300 hover:-translate-y-0.5 hover:bg-journal-ink hover:text-white hover:shadow-[0_14px_34px_rgba(60,64,67,0.22)] active:scale-95 dark:bg-white/10"
            aria-label="Close filters"
          >
            <CloseIcon />
          </button>
        </div>
        <form className="flex min-h-0 flex-1 flex-col" action="/articles">
          <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-journal-line/70 px-4 py-3 sm:grid-cols-5 sm:px-5">
            {filterPages.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setPage(index)}
                className={`rounded-full px-3 py-2 text-sm font-semibold transition duration-300 ${
                  page === index
                    ? "bg-journal-ink text-white shadow-[0_8px_20px_rgba(60,64,67,0.16)]"
                    : "bg-white/72 text-journal-slate shadow-hairline hover:bg-journal-surface hover:text-journal-ink dark:bg-white/8"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden p-4 sm:p-5">
            <FilterPage active={page === 0}>
              <div>
                <label className="metadata-label" htmlFor="q">
                  Search
                </label>
                <input
                  id="q"
                  name="q"
                  defaultValue={filters.query ?? ""}
                  placeholder="Title, abstract, DOI, author, or keyword"
                  className="mt-1 w-full rounded-full bg-white/86 px-4 py-3 text-base text-journal-ink shadow-hairline outline-none transition focus:shadow-[0_8px_24px_rgba(60,64,67,0.14)] dark:bg-white/10"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <NumberField label="Year from" name="yearFrom" value={filters.yearFrom} />
                <NumberField label="Year to" name="yearTo" value={filters.yearTo} />
              </div>
            </FilterPage>

            <FilterPage active={page === 1}>
              <div className="grid gap-3 lg:grid-cols-[1fr_1.35fr_.75fr]">
                <CheckboxGroup
                  label="Journal"
                  name="journal"
                  selected={filters.journal}
                  options={journals}
                />
                <CheckboxGroup
                  label="Category"
                  name="articleCategory"
                  selected={filters.articleCategory}
                  options={articleCategories}
                />
                <CheckboxGroup
                  label="ORA/NORA"
                  name="classification"
                  selected={filters.classification}
                  options={classificationOptions}
                />
              </div>
            </FilterPage>

            <FilterPage active={page === 2}>
              <CheckboxGroup
                label="Article type"
                name="articleType"
                selected={filters.articleType}
                options={articleTypes}
                columns
              />
            </FilterPage>

            <FilterPage active={page === 3}>
              <div className="grid gap-3 lg:grid-cols-3">
                <RadioGroup
                  label="Citation dataset"
                  name="dataset"
                  selected={filters.dataset ?? "Scopus"}
                  options={datasetOptions}
                />
                <CheckboxGroup
                  label="Snapshot"
                  name="snapshot"
                  selected={filters.snapshot}
                  options={snapshotOptions}
                />
                <CheckboxGroup
                  label="Indexed in"
                  name="indexedIn"
                  selected={filters.indexedIn}
                  options={indexedInOptions}
                />
              </div>
            </FilterPage>

            <FilterPage active={page === 4}>
              <RadioGroup
                label="Sort"
                name="sort"
                selected={filters.sort ?? "publicationYearDesc"}
                options={sortOptions.map((option) => option.value)}
                labels={Object.fromEntries(
                  sortOptions.map((option) => [option.value, option.label])
                )}
                columns
              />
            </FilterPage>
          </div>
          <div className="flex shrink-0 flex-col gap-3 border-t border-journal-line/70 bg-white/56 px-4 py-3 backdrop-blur-xl dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center justify-between gap-3 sm:justify-start">
              <button
                type="button"
                disabled={firstPage}
                onClick={() => setPage((current) => Math.max(current - 1, 0))}
                className="rounded-full bg-white/86 px-4 py-2 text-sm font-semibold text-journal-slate shadow-hairline transition hover:-translate-y-0.5 hover:bg-journal-surface disabled:pointer-events-none disabled:opacity-40 dark:bg-white/10"
              >
                Prev
              </button>
              <div className="flex items-center gap-1.5">
                {filterPages.map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    aria-label={`Go to ${label}`}
                    onClick={() => setPage(index)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      page === index ? "w-7 bg-journal-ink" : "w-2.5 bg-journal-muted/30"
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                disabled={lastPage}
                onClick={() =>
                  setPage((current) => Math.min(current + 1, filterPages.length - 1))
                }
                className="rounded-full bg-white/86 px-4 py-2 text-sm font-semibold text-journal-slate shadow-hairline transition hover:-translate-y-0.5 hover:bg-journal-surface disabled:pointer-events-none disabled:opacity-40 dark:bg-white/10"
              >
                Next
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <Link
                href="/articles"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-white/86 px-5 py-3 text-sm font-semibold text-journal-slate shadow-hairline transition hover:-translate-y-0.5 hover:bg-journal-surface dark:bg-white/10"
              >
                Reset
              </Link>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-journal-ink px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(60,64,67,0.18)] transition hover:-translate-y-0.5"
              >
                Apply
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function FilterPage({
  active,
  children
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`h-full ${active ? "grid animate-filter-page gap-4 content-start" : "hidden"}`}
      aria-hidden={!active}
    >
      {children}
    </section>
  );
}

function FilterIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 transition duration-300 group-hover:rotate-90"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    >
      <path d="M7 7l10 10" />
      <path d="M17 7 7 17" />
    </svg>
  );
}

function CheckboxGroup<T extends string>({
  label,
  name,
  selected,
  options,
  labels,
  columns = false
}: {
  label: string;
  name: string;
  selected?: readonly T[];
  options: readonly T[];
  labels?: Record<string, string>;
  columns?: boolean;
}) {
  const selectedValues = new Set(selected ?? []);

  return (
    <details className="group/filter rounded-[22px] bg-white/72 p-2 shadow-hairline dark:bg-white/8" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-full px-3 py-2 text-left marker:hidden">
        <span>
          <span className="metadata-label block">{label}</span>
          <span className="text-xs text-journal-muted">
            {selectedValues.size > 0 ? `${selectedValues.size} selected` : "All"}
          </span>
        </span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-journal-surface text-sm font-semibold text-journal-slate transition group-open/filter:rotate-45 dark:bg-white/10">
          +
        </span>
      </summary>
      <div className={`mt-1 grid gap-1 pr-1 ${columns ? "sm:grid-cols-2" : ""}`}>
        {options.map((option) => (
          <label
            key={option}
            className="flex min-h-10 cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 text-sm text-journal-slate transition hover:bg-journal-surface/90 has-[:checked]:bg-journal-blue/10 has-[:checked]:text-journal-ink dark:hover:bg-white/10"
          >
            <input
              type="checkbox"
              name={name}
              value={option}
              defaultChecked={selectedValues.has(option)}
              className="h-4 w-4 accent-journal-blue"
            />
            <span className="leading-5">{labels?.[option] ?? option}</span>
          </label>
        ))}
      </div>
    </details>
  );
}

function RadioGroup<T extends string>({
  label,
  name,
  selected,
  options,
  labels,
  columns = false
}: {
  label: string;
  name: string;
  selected?: T;
  options: readonly T[];
  labels?: Record<string, string>;
  columns?: boolean;
}) {
  return (
    <fieldset className="rounded-[22px] bg-white/72 p-3 shadow-hairline dark:bg-white/8">
      <legend className="metadata-label px-1">{label}</legend>
      <div className={`mt-2 grid gap-1 ${columns ? "sm:grid-cols-2" : ""}`}>
        {options.map((option) => (
          <label
            key={option}
            className="flex min-h-10 cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 text-sm text-journal-slate transition hover:bg-journal-surface/90 has-[:checked]:bg-journal-ink has-[:checked]:text-white dark:hover:bg-white/10"
          >
            <input
              type="radio"
              name={name}
              value={option}
              defaultChecked={(selected ?? options[0]) === option}
              className="h-4 w-4 accent-journal-blue"
            />
            <span className="leading-5">{labels?.[option] ?? option}</span>
          </label>
        ))}
      </div>
    </fieldset>
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
        className="mt-1 w-full rounded-full bg-white/86 px-4 py-3 text-sm text-journal-ink shadow-hairline outline-none transition focus:shadow-[0_8px_24px_rgba(60,64,67,0.14)] dark:bg-white/10"
      />
    </label>
  );
}
