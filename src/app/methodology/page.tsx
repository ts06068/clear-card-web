import { PageHeader } from "@/components/PageHeader";

const sections = [
  {
    title: "Local Article Records",
    body: "The current development build uses deterministic article-level records generated with a fixed seed. Manuscript table values are extracted from the attached CLEAR-CARD documents, while article-level records, citation links, references, and indexing snapshots are ready to be swapped for a production database."
  },
  {
    title: "Citation Modeling",
    body: "Citation totals are intentionally skewed so a small number of articles become highly cited while most records remain modestly cited. Yearly citation trajectories are allocated from publication year through 2025."
  },
  {
    title: "Visualization",
    body: "All charts, histograms, trajectory comparisons, and graph-style visualizations use Apache ECharts through reusable React components."
  },
  {
    title: "Source Snapshots",
    body: "The interface models Scopus and iCite citation snapshots and WoS indexing badges. WoS is used for indexing and total-citation comparison only, not trajectory comparison."
  },
  {
    title: "Design Direction",
    body: "The interface is inspired by premium cardiovascular journal platforms, using independent styling with deep navy, restrained crimson accents, compact tables, and no JACC or ACC brand assets."
  }
];

export default function MethodologyPage() {
  return (
    <>
      <PageHeader
        title="Methodology"
        subtitle="How the local workspace handles manuscript tables, article records, citation distributions, and source snapshots."
        eyebrow="Workspace notes"
      />
      <section className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <article key={section.title} className="academic-card px-5 py-4">
            <h2 className="text-base font-semibold text-journal-ink">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-journal-slate">{section.body}</p>
          </article>
        ))}
      </section>
    </>
  );
}
