import researchResults from "@/server/data/researchResults.json";
import { ResearchResultsDataset } from "@/types/researchResults";

export async function getResearchResults(): Promise<ResearchResultsDataset> {
  return researchResults as ResearchResultsDataset;
}
