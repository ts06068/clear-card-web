import { PageHeader } from "@/components/PageHeader";

const sections = [
  {
    title: "Aim",
    body: "CLEAR-CARD is built to make cardiovascular citation literature easier to inspect at article, category, journal, and citation-network levels. The platform helps users compare how articles are indexed, cited, categorized, and connected over time without forcing them through static tables."
  },
  {
    title: "Journal Scope",
    body: "The project follows cardiovascular articles published from January 1, 2008 through December 31, 2022 in Journal of the American College of Cardiology, Circulation, European Heart Journal, and JAMA Cardiology. Citation snapshots were collected late enough to support 2-year citation windows through 2022 and 5-year citation trajectories through 2019."
  },
  {
    title: "Data Sources",
    body: "Scopus is the primary source for article metadata and citation records. NIH iCite is used as a validation source for PubMed-indexed records, while Web of Science is used for indexing comparison and total-citation agreement checks."
  },
  {
    title: "Article Collection",
    body: "Articles were collected by journal source identifiers and publication year. Records were screened for a valid title, DOI, publication date, issue or volume context, and duplicates before being linked to citation records."
  },
  {
    title: "Article Categories",
    body: "Categorization starts from the taxonomy headers shown on each journal website, using three-level section placement when available. Those headers are mapped into standardized groups: original research articles, reviews, meta-analyses, guidelines/statements/statistics, and non-citable items."
  },
  {
    title: "Classification Review",
    body: "Taxonomy-based labels are checked against article titles, abstracts, page spans, publication context, and citation metadata. Manual review resolves mismatches, and an LLM-based review pass is used as an additional plausibility check before adjudication."
  },
  {
    title: "Citation Measures",
    body: "Short-term impact is represented with 2-year citation counts. Longer-term behavior is represented with 5-year citation trajectories and article fitness estimates. Reports can also compare publication volume, citation share, simulated journal impact factor components, and citing-journal quality metrics."
  },
  {
    title: "Platform Use",
    body: "The interface is organized for exploration rather than linear reading: users can search articles, filter by indexing source and category, inspect references and citing records, open citation trajectories, and build customized reports from the same citation-literature workspace."
  }
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="About"
        subtitle="A cardiovascular citation-literature workspace for exploring article categories, source indexing, citation trajectories, and journal-level reports."
        eyebrow="CLEAR-CARD platform"
      />
      <section className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2">
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
