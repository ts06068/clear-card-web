import {
  Article,
  ArticleCategory,
  ArticleClassification,
  ArticleReference,
  ArticleType,
  CitationDataset,
  CitationPoint,
  DATASET_SNAPSHOTS,
  DatasetSource,
  JOURNAL_CODES,
  JOURNALS,
  Journal,
  TaxonomyHeader
} from "@/types/bibliometric";
import { createSeededRandom, pickMany, pickOne, weightedPick } from "./random";

const ARTICLE_COUNT = 1200;
const FIRST_PUBLICATION_YEAR = 2008;
const LAST_PUBLICATION_YEAR = 2022;
const DATASET_END_YEAR = 2025;
const SEED = 20250427;

const firstNames = [
  "Maya",
  "Daniel",
  "Sofia",
  "Ethan",
  "Hana",
  "Lucas",
  "Priya",
  "Noah",
  "Amina",
  "Julian",
  "Elena",
  "Marcus",
  "Yuna",
  "Oliver",
  "Iris",
  "Nikhil",
  "Clara",
  "Samuel"
];

const lastNames = [
  "Kim",
  "Patel",
  "Garcia",
  "Anderson",
  "Rossi",
  "Chen",
  "Singh",
  "Morgan",
  "Schmidt",
  "Khan",
  "Dubois",
  "Martinez",
  "Park",
  "Wilson",
  "Tanaka",
  "Hughes",
  "Fischer",
  "Nakamura"
];

const institutions = [
  "Center for Cardiovascular Outcomes Research",
  "Department of Cardiology, Northbridge University Hospital",
  "Heart and Vascular Institute, Metropolitan Medical Center",
  "Division of Cardiovascular Medicine, St. Catherine's Hospital",
  "Institute for Population Cardiology",
  "Cardiac Imaging Research Unit",
  "Electrophysiology and Arrhythmia Program",
  "Clinical Trials Center for Heart Disease",
  "Department of Preventive Cardiology",
  "Valve Disease and Structural Heart Center"
];

const clinicalAreas = [
  "Heart Failure",
  "Arrhythmia",
  "Imaging",
  "Intervention",
  "Prevention",
  "Valvular Disease",
  "Electrophysiology",
  "General Cardiology",
  "Vascular Medicine",
  "Outcomes Research"
] as const;

type ClinicalArea = (typeof clinicalAreas)[number];

const taxonomyLevel1: Record<ArticleCategory, string[]> = {
  "Original Research": ["Clinical Investigation", "Original Research", "Research Article"],
  Review: ["State-of-the-Art Review", "Review", "Contemporary Review"],
  "Meta-analysis": ["Systematic Review", "Meta-analysis", "Evidence Synthesis"],
  "Guideline / Statement / Statistics": [
    "Guideline",
    "Scientific Statement",
    "Statistics and Quality Report"
  ],
  Editorial: ["Editorial Comment", "Viewpoint", "Editorial"],
  "Other Non-original": ["Brief Report", "Research Letter", "Correspondence"]
};

const areaKeywords: Record<ClinicalArea, string[]> = {
  "Heart Failure": [
    "heart failure",
    "reduced ejection fraction",
    "preserved ejection fraction",
    "congestion",
    "ventricular remodeling"
  ],
  Arrhythmia: [
    "atrial fibrillation",
    "rhythm control",
    "stroke prevention",
    "ventricular tachycardia",
    "anticoagulation"
  ],
  Imaging: [
    "cardiac magnetic resonance",
    "computed tomography",
    "echocardiography",
    "myocardial strain",
    "plaque characterization"
  ],
  Intervention: [
    "percutaneous coronary intervention",
    "structural intervention",
    "revascularization",
    "stent thrombosis",
    "complex coronary disease"
  ],
  Prevention: [
    "lipid management",
    "hypertension",
    "cardiometabolic risk",
    "primary prevention",
    "population health"
  ],
  "Valvular Disease": [
    "aortic stenosis",
    "mitral regurgitation",
    "transcatheter valve therapy",
    "valve durability",
    "hemodynamics"
  ],
  Electrophysiology: [
    "catheter ablation",
    "device therapy",
    "conduction system pacing",
    "sudden cardiac death",
    "mapping"
  ],
  "General Cardiology": [
    "clinical outcomes",
    "risk prediction",
    "cardiovascular medicine",
    "quality of care",
    "health systems"
  ],
  "Vascular Medicine": [
    "peripheral artery disease",
    "vascular inflammation",
    "aortic disease",
    "thrombosis",
    "vascular outcomes"
  ],
  "Outcomes Research": [
    "health policy",
    "readmission",
    "quality improvement",
    "clinical registries",
    "implementation"
  ]
};

const studyDesigns = [
  "multicenter cohort study",
  "randomized clinical analysis",
  "international registry study",
  "pragmatic outcomes evaluation",
  "longitudinal observational study",
  "contemporary practice analysis"
];

const patientGroups = [
  "older adults",
  "women with cardiovascular disease",
  "patients with multimorbidity",
  "community-based patients",
  "high-risk patients",
  "patients after hospitalization",
  "trial-eligible patients",
  "patients in contemporary practice"
];

const categoryToArticleTypes: Record<ArticleCategory, readonly ArticleType[]> = {
  "Original Research": ["Original Research Article"],
  Review: ["Review"],
  "Meta-analysis": ["Meta-analysis"],
  "Guideline / Statement / Statistics": ["Guideline", "Consensus Statement", "Statistics"],
  Editorial: ["Editorial"],
  "Other Non-original": ["Editorial", "Review"]
};

const journalWeights: Record<Journal, number> = {
  "Journal of the American College of Cardiology": 1.15,
  Circulation: 1.18,
  "European Heart Journal": 1.1,
  "JAMA Cardiology": 0.92
};

const categoryCitationWeights: Record<ArticleCategory, number> = {
  "Original Research": 1.0,
  Review: 1.45,
  "Meta-analysis": 1.55,
  "Guideline / Statement / Statistics": 2.45,
  Editorial: 0.42,
  "Other Non-original": 0.55
};

function makeDate(year: number, random: () => number) {
  const month = 1 + Math.floor(random() * 12);
  const day = 1 + Math.floor(random() * 28);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function makeDoi(index: number, year: number, journal: Journal) {
  const journalCode = JOURNAL_CODES[journal].toLowerCase();
  return `10.5555/clear-card.${journalCode}.${year}.${String(index + 1).padStart(5, "0")}`;
}

function makeAuthors(index: number, random: () => number) {
  const authorCount = 3 + Math.floor(random() * 8);
  const authors = Array.from({ length: authorCount }, () => {
    const first = pickOne(firstNames, random);
    const last = pickOne(lastNames, random);
    const affiliation = pickOne(institutions, random);

    return {
      name: `${first} ${last}`,
      affiliation
    };
  });

  if (index % 41 === 0) {
    authors[0] = {
      name: "Alexandra Mercer",
      affiliation: "Center for Cardiovascular Outcomes Research"
    };
  }

  return authors;
}

function makeArticleCategory(year: number, random: () => number): ArticleCategory {
  const progress = (year - FIRST_PUBLICATION_YEAR) / (LAST_PUBLICATION_YEAR - FIRST_PUBLICATION_YEAR);

  return weightedPick(
    [
      { value: "Original Research" as const, weight: 58 - progress * 22 },
      { value: "Review" as const, weight: 13 + progress * 4 },
      { value: "Meta-analysis" as const, weight: 7 + progress * 2 },
      { value: "Guideline / Statement / Statistics" as const, weight: 6 + progress * 11 },
      { value: "Editorial" as const, weight: 11 + progress * 3 },
      { value: "Other Non-original" as const, weight: 5 + progress * 2 }
    ],
    random
  );
}

function makeArticleType(category: ArticleCategory, random: () => number): ArticleType {
  return pickOne(categoryToArticleTypes[category], random);
}

function makeClassification(category: ArticleCategory): ArticleClassification {
  return category === "Original Research" ? "ORA" : "NORA";
}

function makeTaxonomy(
  journal: Journal,
  category: ArticleCategory,
  area: ClinicalArea,
  articleType: ArticleType,
  random: () => number
): TaxonomyHeader {
  const level1 = pickOne(taxonomyLevel1[category], random);
  const journalSpecificArea =
    journal === "European Heart Journal" ? `${area} and Clinical Practice` : area;
  const level3 =
    articleType === "Statistics"
      ? "Annual Statistical Update"
      : articleType === "Guideline"
        ? "Practice Guideline"
        : articleType === "Consensus Statement"
          ? "Expert Consensus"
          : pickOne(studyDesigns, random);

  return {
    level1,
    level2: journalSpecificArea,
    level3,
    display: `${level1} / ${journalSpecificArea} / ${level3}`
  };
}

function makeTitle(
  area: ClinicalArea,
  articleType: ArticleType,
  category: ArticleCategory,
  random: () => number
) {
  const focus = pickOne(areaKeywords[area], random);
  const patients = pickOne(patientGroups, random);
  const design = pickOne(studyDesigns, random);

  if (articleType === "Guideline") {
    return `Clinical practice guideline for ${focus}`;
  }

  if (articleType === "Consensus Statement") {
    return `Expert consensus statement on ${focus}`;
  }

  if (articleType === "Statistics") {
    return `Cardiovascular statistics update for ${focus} and outcomes`;
  }

  if (articleType === "Review") {
    return `Contemporary review of ${focus} in cardiovascular medicine`;
  }

  if (articleType === "Editorial") {
    return `Editorial perspective on ${focus} and journal citation impact`;
  }

  if (articleType === "Meta-analysis") {
    return `${focus} in ${patients}: systematic review and meta-analysis`;
  }

  const patterns = [
    `${focus} and clinical outcomes in ${patients}`,
    `Temporal trends in ${focus} across contemporary cardiology practice`,
    `${focus} after hospitalization: ${design}`,
    `Risk stratification for ${focus} in ${patients}`,
    `Comparative effectiveness of care strategies for ${focus}`,
    `Association of ${focus} with long-term cardiovascular events`
  ];

  return category === "Original Research"
    ? pickOne(patterns, random)
    : `Research letter: ${pickOne(patterns, random)}`;
}

function makeAbstract(
  area: ClinicalArea,
  articleType: ArticleType,
  category: ArticleCategory,
  random: () => number
) {
  const focus = pickOne(areaKeywords[area], random);
  const population = pickOne(patientGroups, random);
  const design = pickOne(studyDesigns, random);
  const categorySentence =
    category === "Original Research"
      ? "This record represents primary research in the CLEAR-CARD explorer prototype."
      : "This record represents non-original cardiovascular literature used to model contribution to journal citation metrics.";

  return `Background: ${focus} remains central to cardiovascular publishing. Methods: This local ${design} represents ${population} and is generated deterministically for development. Results: Citation counts, fitness, indexing status, and citation links are skewed to mimic cardiovascular bibliometric distributions. Conclusions: ${categorySentence}`;
}

function makeKeywords(area: ClinicalArea, random: () => number) {
  return [
    ...pickMany(areaKeywords[area], random, 3, 4),
    ...pickMany(
      [
        "outcomes",
        "registry",
        "citation impact",
        "fitness",
        "journal impact factor",
        "bibliometrics",
        "quality",
        "longitudinal trends"
      ],
      random,
      2,
      3
    )
  ];
}

function makeCitationTotal(
  journal: Journal,
  category: ArticleCategory,
  publicationYear: number,
  random: () => number
) {
  const exposureYears = DATASET_END_YEAR - publicationYear + 1;
  const progress = (publicationYear - FIRST_PUBLICATION_YEAR) / (LAST_PUBLICATION_YEAR - FIRST_PUBLICATION_YEAR);
  const heavyTail = Math.pow(1 - random(), -1.18);
  const oraPlateau = category === "Original Research" ? 0.96 + Math.sin(progress * Math.PI) * 0.08 : 1;
  const gssExpansion =
    category === "Guideline / Statement / Statistics" ? 1.25 + progress * 1.05 : 1;
  const base =
    (heavyTail - 1) *
    25 *
    (0.7 + exposureYears / 7.8) *
    journalWeights[journal] *
    categoryCitationWeights[category] *
    oraPlateau *
    gssExpansion;

  return Math.max(0, Math.min(Math.round(base + random() * 11), 5200));
}

function makeCitationTrajectory(
  totalCitationCount: number,
  publicationYear: number,
  random: () => number,
  multiplier = 1
): CitationPoint[] {
  const years = Array.from(
    { length: DATASET_END_YEAR - publicationYear + 1 },
    (_, index) => publicationYear + index
  );
  const adjustedTotal = Math.max(0, Math.round(totalCitationCount * multiplier));

  if (adjustedTotal === 0) {
    return years.map((year) => ({ year, citations: 0 }));
  }

  const weights = years.map((year) => {
    const age = year - publicationYear;
    const earlyGrowth = Math.pow(age + 1, 1.32);
    const decay = Math.exp(-Math.max(age - 5, 0) / 9);
    return earlyGrowth * decay * (0.72 + random() * 0.56);
  });
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const rounded = weights.map((weight) => Math.floor((weight / totalWeight) * adjustedTotal));
  let remainder = adjustedTotal - rounded.reduce((sum, value) => sum + value, 0);

  while (remainder > 0) {
    const index = Math.floor(random() * rounded.length);
    rounded[index] += 1;
    remainder -= 1;
  }

  return years.map((year, index) => ({
    year,
    citations: rounded[index]
  }));
}

function sumFirstTwoYears(points: CitationPoint[]) {
  return points.slice(0, Math.min(2, points.length)).reduce((sum, point) => sum + point.citations, 0);
}

function makeFitness(totalCitationCount: number, category: ArticleCategory, random: () => number) {
  const categoryBoost =
    category === "Guideline / Statement / Statistics"
      ? 0.48
      : category === "Original Research"
        ? 0
        : category === "Review" || category === "Meta-analysis"
          ? 0.22
          : -0.18;
  return Math.max(0.05, Number((0.45 + Math.log1p(totalCitationCount) / 4.2 + categoryBoost + random() * 0.28).toFixed(2)));
}

function makeDatasetIndexing(
  category: ArticleCategory,
  articleType: ArticleType,
  totalCitationCount: number,
  twoYearCitationCount: number,
  fitness: number,
  random: () => number
) {
  const snapshot = DATASET_SNAPSHOTS[DATASET_SNAPSHOTS.length - 1];
  const scopusCategory = articleType === "Original Research Article" ? "Article" : articleType;
  const pubmedCategory =
    category === "Original Research"
      ? "Journal Article"
      : articleType === "Guideline"
        ? "Practice Guideline"
        : articleType === "Consensus Statement"
          ? "Consensus Development Conference"
          : articleType;
  const wosCategory =
    category === "Original Research"
      ? "Article"
      : articleType === "Editorial"
        ? "Editorial Material"
        : articleType === "Guideline" || articleType === "Consensus Statement"
          ? "Review"
          : articleType;
  const iciteIndexed = category !== "Other Non-original" && random() > 0.12;
  const wosIndexed = random() > 0.07;
  const snapshotWindow = (indexed: boolean) => {
    if (!indexed) {
      return [];
    }

    const firstSnapshotIndex = random() > 0.9 ? 1 : random() > 0.96 ? 2 : 0;
    return DATASET_SNAPSHOTS.slice(firstSnapshotIndex);
  };
  const scopusSnapshots = snapshotWindow(true);
  const iciteSnapshots = snapshotWindow(iciteIndexed);
  const wosSnapshots = snapshotWindow(wosIndexed);

  return {
    Scopus: {
      indexed: true,
      snapshot,
      indexedSnapshots: scopusSnapshots,
      originalCategory: scopusCategory,
      totalCitationCount,
      twoYearCitationCount,
      fitness
    },
    iCite: {
      indexed: iciteIndexed,
      snapshot,
      indexedSnapshots: iciteSnapshots,
      originalCategory: pubmedCategory,
      totalCitationCount: iciteIndexed ? Math.max(0, Math.round(totalCitationCount * (0.82 + random() * 0.2))) : null,
      twoYearCitationCount: iciteIndexed
        ? Math.max(0, Math.round(twoYearCitationCount * (0.84 + random() * 0.18)))
        : null,
      fitness: iciteIndexed ? Number((fitness * (0.94 + random() * 0.12)).toFixed(2)) : null
    },
    WoS: {
      indexed: wosIndexed,
      snapshot,
      indexedSnapshots: wosSnapshots,
      originalCategory: wosCategory,
      totalCitationCount: wosIndexed ? Math.max(0, Math.round(totalCitationCount * (0.9 + random() * 0.24))) : null,
      twoYearCitationCount: null,
      fitness: null
    }
  } satisfies Record<DatasetSource, Article["datasetIndexing"][DatasetSource]>;
}

function makeExternalReference(index: number, year: number, random: () => number): ArticleReference {
  const journal = pickOne(
    ["The Lancet", "New England Journal of Medicine", "BMJ", "Nature Medicine", "Annals of Internal Medicine"],
    random
  );

  return {
    title: `Foundational cardiovascular evidence synthesis ${index + 1}`,
    authors: [`${pickOne(firstNames, random)} ${pickOne(lastNames, random)}`],
    journal,
    publicationYear: Math.max(1995, year - 1 - Math.floor(random() * 16)),
    doi: `10.7777/reference.${String(index + 1).padStart(5, "0")}`
  };
}

function makeBaseArticle(index: number, random: () => number): Article {
  const publicationYear =
    FIRST_PUBLICATION_YEAR +
    ((index * 7 + Math.floor(random() * 19)) % (LAST_PUBLICATION_YEAR - FIRST_PUBLICATION_YEAR + 1));
  const journalPool =
    publicationYear < 2016 ? JOURNALS.filter((journal) => journal !== "JAMA Cardiology") : JOURNALS;
  const journal = journalPool[index % journalPool.length];
  const area = clinicalAreas[(index + Math.floor(random() * clinicalAreas.length)) % clinicalAreas.length];
  const articleCategory = makeArticleCategory(publicationYear, random);
  const articleType = makeArticleType(articleCategory, random);
  const classification = makeClassification(articleCategory);
  const authors = makeAuthors(index, random);
  const totalCitationCount = makeCitationTotal(journal, articleCategory, publicationYear, random);
  const scopusTrajectory = makeCitationTrajectory(totalCitationCount, publicationYear, random);
  const twoYearCitationCount = sumFirstTwoYears(scopusTrajectory);
  const fitness = makeFitness(totalCitationCount, articleCategory, random);
  const iCiteMultiplier = 0.82 + random() * 0.22;
  const citationTrajectories: Record<CitationDataset, CitationPoint[]> = {
    Scopus: scopusTrajectory,
    iCite: makeCitationTrajectory(totalCitationCount, publicationYear, random, iCiteMultiplier)
  };

  return {
    id: `art-${String(index + 1).padStart(4, "0")}`,
    title: makeTitle(area, articleType, articleCategory, random),
    abstract: makeAbstract(area, articleType, articleCategory, random),
    doi: makeDoi(index, publicationYear, journal),
    journal,
    authors,
    affiliations: Array.from(new Set(authors.map((author) => author.affiliation))),
    keywords: makeKeywords(area, random),
    publicationDate: makeDate(publicationYear, random),
    publicationYear,
    volume: String(40 + (publicationYear - 2000) + Math.floor(index % 13)),
    issue: String(1 + Math.floor(random() * 12)),
    pageSpan: `${1 + Math.floor(random() * 90)}-${95 + Math.floor(random() * 850)}`,
    articleType,
    articleCategory,
    classification,
    taxonomy: makeTaxonomy(journal, articleCategory, area, articleType, random),
    datasetIndexing: makeDatasetIndexing(
      articleCategory,
      articleType,
      totalCitationCount,
      twoYearCitationCount,
      fitness,
      random
    ),
    citationTrajectories,
    totalCitationCount,
    twoYearCitationCount,
    fitness,
    twoYearCitationQuantile: 0,
    fitnessQuantile: 0,
    referenceArticleIds: [],
    referenceArticles: [],
    citationNetworkTargetIds: []
  };
}

function withCitationLinks(articles: Article[], random: () => number) {
  const byEarlierYear = articles.map((article, index) => ({
    article,
    index
  }));

  return articles.map((article, index) => {
    const candidates = byEarlierYear.filter(
      (candidate) =>
        candidate.index !== index &&
        candidate.article.publicationYear <= article.publicationYear &&
        candidate.article.publicationYear >= article.publicationYear - 8
    );
    const internalReferenceCount = Math.min(candidates.length, 2 + Math.floor(random() * 7));
    const referenceArticleIds = pickMany(
      candidates.map((candidate) => candidate.article.id),
      random,
      Math.min(1, internalReferenceCount),
      internalReferenceCount
    );
    const internalReferences = referenceArticleIds
      .map((id) => articles.find((candidate) => candidate.id === id))
      .filter((candidate): candidate is Article => Boolean(candidate))
      .map<ArticleReference>((candidate) => ({
        id: candidate.id,
        title: candidate.title,
        authors: candidate.authors.slice(0, 3).map((author) => author.name),
        journal: candidate.journal,
        publicationYear: candidate.publicationYear,
        doi: candidate.doi
      }));
    const externalReferences = Array.from(
      { length: 3 + Math.floor(random() * 5) },
      (_, refIndex) => makeExternalReference(index * 10 + refIndex, article.publicationYear, random)
    );

    return {
      ...article,
      referenceArticleIds,
      referenceArticles: [...internalReferences, ...externalReferences],
      citationNetworkTargetIds: referenceArticleIds.slice(0, 4)
    };
  });
}

function percentileRank(values: number[], value: number) {
  if (values.length <= 1) {
    return 1;
  }

  const lessOrEqual = values.filter((candidate) => candidate <= value).length;
  return Number((lessOrEqual / values.length).toFixed(3));
}

function withQuantiles(articles: Article[]) {
  return articles.map((article) => {
    const group = articles.filter(
      (candidate) =>
        candidate.journal === article.journal &&
        candidate.publicationYear === article.publicationYear &&
        candidate.articleCategory === article.articleCategory
    );

    return {
      ...article,
      twoYearCitationQuantile: percentileRank(
        group.map((candidate) => candidate.twoYearCitationCount),
        article.twoYearCitationCount
      ),
      fitnessQuantile: percentileRank(
        group.map((candidate) => candidate.fitness),
        article.fitness
      )
    };
  });
}

let cachedArticles: Article[] | null = null;

export function getDummyArticles() {
  if (!cachedArticles) {
    const random = createSeededRandom(SEED);
    const baseArticles = Array.from({ length: ARTICLE_COUNT }, (_, index) =>
      makeBaseArticle(index, random)
    );
    cachedArticles = withQuantiles(withCitationLinks(baseArticles, random));
  }

  return cachedArticles;
}
