import { JournalVolumeChart } from "@/components/charts/BibliometricCharts";
import { PageHeader } from "@/components/PageHeader";
import { bibliometricRepository } from "@/server/repositories";
import { getHomeDashboardData } from "@/server/services";

export default async function JournalsPage() {
  const dashboard = await getHomeDashboardData(bibliometricRepository);

  return (
    <>
      <PageHeader
        title="Journals"
        subtitle="Journal-level article volume, category mix, and citation metric views for the CLEAR-CARD workspace."
        eyebrow="Journal view"
      />
      <JournalVolumeChart data={dashboard.articleVolumeByJournal} height={360} />
    </>
  );
}
