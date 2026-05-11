import { CitationNetworkExplorer } from "@/components/charts/CitationNetworkExplorer";
import { bibliometricRepository } from "@/server/repositories";
import { getHomeDashboardData } from "@/server/services";

export default async function HomePage() {
  const dashboard = await getHomeDashboardData(bibliometricRepository);

  return (
    <div className="relative h-screen overflow-hidden">
      <CitationNetworkExplorer data={dashboard.citationNetwork} />

      <section className="pointer-events-none absolute inset-x-4 top-[9vh] z-10 mx-auto max-w-5xl animate-gentle-pop text-center sm:top-[10vh]">
        <h1 className="gradient-title text-5xl font-semibold leading-[1.02] sm:text-7xl">
          Citation Landscape Explorer in Cardiovascular Journals, 2008-2022
        </h1>
        <form action="/articles" className="pointer-events-auto mx-auto mt-7 max-w-3xl">
          <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 shadow-[0_10px_36px_rgba(60,64,67,0.18)] ring-1 ring-black/5 transition duration-300 focus-within:shadow-[0_16px_48px_rgba(60,64,67,0.22)] dark:bg-white/10 dark:ring-white/10">
            <span className="h-5 w-5 rounded-full border-2 border-journal-muted" />
            <input
              id="home-search"
              name="q"
              placeholder="Search articles, authors, DOI, taxonomy, keyword"
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-lg text-journal-ink outline-none placeholder:text-journal-muted"
            />
            <button className="rounded-full bg-journal-control px-5 py-2.5 text-sm font-semibold text-journal-control-ink shadow-[0_8px_22px_rgba(60,64,67,0.18)] transition duration-300 hover:-translate-y-0.5">
              Search
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
