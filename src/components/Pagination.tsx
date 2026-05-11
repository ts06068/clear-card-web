import Link from "next/link";
import type { PlainSearchParams } from "@/lib/searchParams";

function pageHref(searchParams: PlainSearchParams, page: number) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page") {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else {
      params.set(key, value);
    }
  }

  if (page <= 1) {
    params.delete("page");
  } else {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/articles?${query}` : "/articles";
}

function pageWindow(page: number, totalPages: number) {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);

  if (page <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }

  if (page >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
  }

  return Array.from(pages)
    .filter((candidate) => candidate >= 1 && candidate <= totalPages)
    .sort((a, b) => a - b);
}

export function Pagination({
  page,
  totalPages,
  searchParams
}: {
  page: number;
  totalPages: number;
  searchParams: PlainSearchParams;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = pageWindow(page, totalPages);

  return (
    <nav className="sticky bottom-4 z-20 mx-auto mt-6 flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-full bg-white/82 p-1.5 text-sm shadow-[0_14px_44px_rgba(60,64,67,0.18)] backdrop-blur-xl dark:bg-white/10">
      <PageLink disabled={page === 1} href={pageHref(searchParams, 1)}>
        First
      </PageLink>
      <PageLink disabled={page === 1} href={pageHref(searchParams, Math.max(page - 1, 1))}>
        Prev
      </PageLink>
      {pages.map((candidate, index) => {
        const previous = pages[index - 1];
        const showGap = previous !== undefined && candidate - previous > 1;

        return (
          <span key={candidate} className="flex items-center gap-1">
            {showGap ? <span className="px-1 text-journal-muted">...</span> : null}
            <PageLink active={candidate === page} href={pageHref(searchParams, candidate)}>
              {candidate}
            </PageLink>
          </span>
        );
      })}
      <PageLink
        disabled={page === totalPages}
        href={pageHref(searchParams, Math.min(page + 1, totalPages))}
      >
        Next
      </PageLink>
      <PageLink disabled={page === totalPages} href={pageHref(searchParams, totalPages)}>
        Last
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  children,
  active = false,
  disabled = false
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-disabled={disabled}
      className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-full px-3 font-semibold transition ${
        active
          ? "bg-journal-control text-journal-control-ink shadow-[0_8px_20px_rgba(60,64,67,0.18)]"
          : disabled
            ? "pointer-events-none text-journal-muted/50"
            : "text-journal-slate hover:bg-journal-surface hover:text-journal-ink"
      }`}
    >
      {children}
    </Link>
  );
}
