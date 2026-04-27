export function PageHeader({
  title,
  subtitle,
  eyebrow
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  return (
    <section className="mb-6 animate-soft-rise border-b border-journal-line pb-5">
      {eyebrow ? <p className="metadata-label mb-2">{eyebrow}</p> : null}
      <h1 className="max-w-5xl text-3xl font-semibold leading-tight text-journal-ink sm:text-4xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-3 max-w-4xl text-base leading-7 text-journal-slate">
          {subtitle}
        </p>
      ) : null}
    </section>
  );
}
