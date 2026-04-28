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
    <section className="mx-auto mb-8 max-w-7xl animate-soft-rise pb-2 pt-8">
      {eyebrow ? <p className="metadata-label mb-2">{eyebrow}</p> : null}
      <h1 className="gradient-title max-w-5xl text-5xl font-semibold leading-[1.04] sm:text-6xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-4 max-w-4xl text-lg leading-8 text-journal-slate">
          {subtitle}
        </p>
      ) : null}
    </section>
  );
}
