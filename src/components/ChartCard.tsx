export function ChartCard({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="academic-card overflow-hidden">
      <div className="px-4 py-3">
        <h2 className="text-base font-semibold text-journal-ink">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-xs leading-5 text-journal-muted">{subtitle}</p>
        ) : null}
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}
