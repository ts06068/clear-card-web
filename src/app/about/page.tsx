import { PageHeader } from "@/components/PageHeader";

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="About"
        subtitle="CLEAR-CARD is a cardiovascular citation-literature workspace for examining article categories, indexing sources, citation trajectories, and journal-level evidence."
        eyebrow="CLEAR-CARD platform"
      />

      <article className="mx-auto max-w-4xl space-y-8 pb-12 text-lg leading-8 text-journal-slate">
        <section>
          <h2 className="text-2xl font-semibold text-journal-ink">Purpose</h2>
          <p className="mt-3">
            CLEAR-CARD is designed for people who need to read citation data with the same care
            they bring to a manuscript or editorial report. The interface links article metadata,
            journal taxonomy, indexing status, citation trajectories, and citation-network context
            so that users can move from a journal-level pattern to the individual articles behind it.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-journal-ink">Scope</h2>
          <p className="mt-3">
            The workspace follows cardiovascular literature from four major journals between 2008
            and 2022: Journal of the American College of Cardiology, Circulation, European Heart
            Journal, and JAMA Cardiology. The design emphasizes comparisons across publication
            year, article category, journal taxonomy, indexing source, and citation timing.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-journal-ink">Data Model</h2>
          <p className="mt-3">
            Each article is represented with publication metadata, authorship, DOI, journal
            taxonomy headers, standardized article categories, source-specific indexing labels,
            references, citing records, and temporal citation counts. Scopus and iCite can be
            selected as citation sources, while Web of Science indexing status is retained for
            source comparison.
          </p>
          <p className="mt-3">
            Article categories are derived from journal taxonomy and publication context, then
            normalized into groups that are meaningful for editorial review: original research,
            reviews, meta-analyses, guidelines and statements, editorials, and other non-original
            material. The goal is to keep the source taxonomy visible while making cross-journal
            comparisons possible.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-journal-ink">How To Read The Reports</h2>
          <p className="mt-3">
            The reports are meant to be read as evidence summaries rather than as dashboards.
            Journal-level metrics lead to the citable items and citing articles that form the
            numerator and denominator. Citation-performance views show which articles gain early
            attention, which sustain attention, and which contribute less than expected. Citation
            age views describe whether influence arrives quickly, persists, or returns later through
            newer citing literature.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-journal-ink">Current Implementation</h2>
          <p className="mt-3">
            This local build uses an internally consistent demonstration dataset so the full
            workflow can be inspected without external database credentials. The repository and
            service layers are organized so that the same interface can later be backed by SQL
            Server tables populated from licensed citation sources.
          </p>
        </section>
      </article>
    </>
  );
}
