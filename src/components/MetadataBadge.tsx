export function MetadataBadge({
  children,
  tone = "neutral"
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "blue";
}) {
  const classes = {
    neutral: "border-journal-line bg-white text-journal-slate dark:bg-white/5",
    accent: "border-red-200 bg-red-50 text-journal-crimsonDark dark:border-red-300/30 dark:bg-red-300/10 dark:text-red-100",
    blue: "border-blue-200 bg-blue-50 text-journal-blue dark:border-blue-300/30 dark:bg-blue-300/10 dark:text-blue-100"
  };

  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 text-xs font-medium transition ${classes[tone]}`}
    >
      {children}
    </span>
  );
}
