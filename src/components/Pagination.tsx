import Link from "next/link";

function pageHref(searchParams: Record<string, string>, page: number) {
  const params = new URLSearchParams(searchParams);

  if (page <= 1) {
    params.delete("page");
  } else {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/articles?${query}` : "/articles";
}

export function Pagination({
  page,
  totalPages,
  searchParams
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string>;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <Link
        href={pageHref(searchParams, Math.max(page - 1, 1))}
        className={`border px-3 py-2 font-semibold ${
          page === 1
            ? "pointer-events-none border-journal-line text-journal-muted"
            : "border-journal-line bg-white text-journal-slate hover:border-journal-slate"
        }`}
      >
        Previous
      </Link>
      <span className="text-journal-muted">
        Page <span className="font-semibold text-journal-ink">{page}</span> of{" "}
        <span className="font-semibold text-journal-ink">{totalPages}</span>
      </span>
      <Link
        href={pageHref(searchParams, Math.min(page + 1, totalPages))}
        className={`border px-3 py-2 font-semibold ${
          page === totalPages
            ? "pointer-events-none border-journal-line text-journal-muted"
            : "border-journal-line bg-white text-journal-slate hover:border-journal-slate"
        }`}
      >
        Next
      </Link>
    </div>
  );
}
