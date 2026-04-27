import Link from "next/link";

export function ArticleTitleLink({ id, title }: { id: string; title: string }) {
  return (
    <Link
      href={`/articles/${id}`}
      className="font-semibold leading-5 text-journal-ink hover:text-journal-crimson hover:underline"
    >
      {title}
    </Link>
  );
}
