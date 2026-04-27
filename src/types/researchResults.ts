export interface ResearchCell {
  raw: string;
  value: number | null;
  secondaryValue: number | null;
}

export interface ResearchTableRecord {
  journalCode: string;
  journal: string;
  year: number;
  values: Record<string, ResearchCell>;
}

export interface ResearchTable {
  id: string;
  number: number;
  title: string;
  sourceLabel: string;
  columns: string[];
  records: ResearchTableRecord[];
}

export interface MainFigureLegend {
  id: string;
  title: string;
  legend: string;
}

export interface ResearchResultsDataset {
  source: Record<string, string>;
  mainFigures: MainFigureLegend[];
  supplementalFigures?: MainFigureLegend[];
  supplementalTables: ResearchTable[];
  narrativeFindings: string[];
}
