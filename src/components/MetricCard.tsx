export function MetricCard({
  label,
  value,
  helper
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <article className="academic-card interactive-lift px-4 py-3">
      <p className="metadata-label">{label}</p>
      <p className="mt-2 break-words text-3xl font-semibold text-journal-ink">
        {value}
      </p>
      {helper ? <p className="mt-1 text-xs text-journal-muted">{helper}</p> : null}
    </article>
  );
}
