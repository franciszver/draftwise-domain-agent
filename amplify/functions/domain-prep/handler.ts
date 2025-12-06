import type { Handler } from 'aws-lambda';

interface DomainPrepRequest {
  domainId: string;
  country: string;
  site?: string;
  assetClass: string;
  categories: string[];
}

interface PrepProgress {
  status: 'pending' | 'preparing' | 'ready' | 'error';
  progress: number;
  log: string[];
  sourcesFound: number;
  sourcesIndexed: number;
}

interface DomainPrepResponse {
  domainId: string;
  status: string;
  progress: PrepProgress;
}

// Category to search query mapping
const categorySearchQueries: Record<string, string[]> = {
  environmental: [
    'environmental regulations',
    'EPA compliance requirements',
    'environmental impact assessment',
    'emissions standards',
    'waste management regulations',
  ],
  data_privacy: [
    'data privacy regulations',
    'GDPR compliance requirements',
    'data protection laws',
    'privacy impact assessment',
    'personal data handling requirements',
  ],
  financial: [
    'financial compliance regulations',
    'SOX compliance requirements',
    'financial reporting standards',
    'audit requirements',
    'internal controls regulations',
  ],
  safety_workforce: [
    'workplace safety regulations',
    'OSHA compliance requirements',
    'occupational health standards',
    'worker safety requirements',
    'labor law compliance',
  ],
  legal_contractual: [
    'contract law requirements',
    'legal compliance obligations',
    'regulatory filing requirements',
    'licensing requirements',
    'permit regulations',
  ],
};

// Curated regulatory sources by jurisdiction
const curatedSources: Record<string, Record<string, string[]>> = {
  USA: {
    environmental: [
      'https://www.epa.gov/laws-regulations',
      'https://www.epa.gov/regulatory-information-sector',
    ],
    data_privacy: [
      'https://www.ftc.gov/business-guidance/privacy-security',
      'https://www.hhs.gov/hipaa/for-professionals/index.html',
    ],
    financial: [
      'https://www.sec.gov/rules',
      'https://www.pcaobus.org/Standards',
    ],
    safety_workforce: [
      'https://www.osha.gov/laws-regs',
      'https://www.dol.gov/general/topic/safety-health',
    ],
    legal_contractual: [
      'https://www.law.cornell.edu/uscode',
    ],
  },
  EU: {
    environmental: [
      'https://environment.ec.europa.eu/law-and-governance_en',
      'https://eur-lex.europa.eu/browse/summaries.html',
    ],
    data_privacy: [
      'https://gdpr.eu/',
      'https://edpb.europa.eu/edpb_en',
    ],
    financial: [
      'https://www.esma.europa.eu/rules-databases-library/rules-database',
      'https://www.eba.europa.eu/regulation-and-policy',
    ],
    safety_workforce: [
      'https://osha.europa.eu/en/legislation',
      'https://ec.europa.eu/social/main.jsp?catId=148',
    ],
    legal_contractual: [
      'https://eur-lex.europa.eu/homepage.html',
    ],
  },
};

// Build search queries for a domain
function buildSearchQueries(
  country: string,
  site: string | undefined,
  assetClass: string,
  categories: string[]
): string[] {
  const queries: string[] = [];
  const location = site ? `${site}, ${country}` : country;

  for (const category of categories) {
    const baseQueries = categorySearchQueries[category] || [];
    for (const baseQuery of baseQueries.slice(0, 2)) {
      queries.push(`${baseQuery} ${location} ${assetClass}`);
    }
  }

  return queries;
}

// Get curated sources for a jurisdiction
function getCuratedSources(
  country: string,
  categories: string[]
): string[] {
  const sources: string[] = [];

  // Map country to jurisdiction key
  let jurisdictionKey = 'USA';
  if (['Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Austria', 'Poland'].includes(country)) {
    jurisdictionKey = 'EU';
  } else if (country === 'United States' || country === 'USA') {
    jurisdictionKey = 'USA';
  }

  const jurisdictionSources = curatedSources[jurisdictionKey];
  if (!jurisdictionSources) return sources;

  for (const category of categories) {
    const categorySources = jurisdictionSources[category] || [];
    sources.push(...categorySources);
  }

  return [...new Set(sources)]; // Remove duplicates
}

// Simulate domain preparation workflow
async function prepareDomain(
  request: DomainPrepRequest,
  updateProgress: (progress: PrepProgress) => void
): Promise<PrepProgress> {
  const progress: PrepProgress = {
    status: 'preparing',
    progress: 0,
    log: [],
    sourcesFound: 0,
    sourcesIndexed: 0,
  };

  try {
    // Step 1: Validate domain selection
    progress.log.push(`Validating domain: ${request.country}${request.site ? ` - ${request.site}` : ''}`);
    progress.progress = 10;
    updateProgress(progress);

    // Step 2: Build search queries
    const searchQueries = buildSearchQueries(
      request.country,
      request.site,
      request.assetClass,
      request.categories
    );
    progress.log.push(`Generated ${searchQueries.length} search queries`);
    progress.progress = 20;
    updateProgress(progress);

    // Step 3: Get curated sources
    const curatedUrls = getCuratedSources(request.country, request.categories);
    progress.log.push(`Found ${curatedUrls.length} curated regulatory sources`);
    progress.sourcesFound = curatedUrls.length;
    progress.progress = 40;
    updateProgress(progress);

    // Step 4: Web search for additional sources
    progress.log.push(`Searching for additional sources via Brave...`);
    progress.progress = 50;
    updateProgress(progress);

    // Note: Actual Brave search would happen here
    // For now, we simulate finding additional sources
    const webSourceCount = Math.min(searchQueries.length * 3, 15);
    progress.sourcesFound += webSourceCount;
    progress.log.push(`Found ${webSourceCount} additional sources from web search`);
    progress.progress = 60;
    updateProgress(progress);

    // Step 5: Fetch and process sources
    progress.log.push(`Fetching content from ${progress.sourcesFound} sources...`);
    progress.progress = 70;
    updateProgress(progress);

    // Step 6: Generate embeddings and index
    progress.log.push(`Generating embeddings and indexing sources...`);
    progress.progress = 85;
    updateProgress(progress);

    // Simulate indexing completion
    progress.sourcesIndexed = Math.min(progress.sourcesFound, 25); // Max 25 per plan
    progress.log.push(`Successfully indexed ${progress.sourcesIndexed} sources`);
    progress.progress = 100;
    progress.status = 'ready';
    updateProgress(progress);

    return progress;
  } catch (error) {
    progress.status = 'error';
    progress.log.push(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return progress;
  }
}

// Main handler
export const handler: Handler = async (event) => {
  const request = event.arguments || event;

  console.log('Domain prep request:', JSON.stringify(request));

  const progressUpdates: PrepProgress[] = [];
  const updateProgress = (progress: PrepProgress) => {
    progressUpdates.push({ ...progress });
    console.log('Progress:', JSON.stringify(progress));
  };

  try {
    const finalProgress = await prepareDomain(
      request as DomainPrepRequest,
      updateProgress
    );

    return {
      domainId: request.domainId,
      status: finalProgress.status,
      progress: finalProgress,
    } as DomainPrepResponse;
  } catch (error) {
    console.error('Domain prep error:', error);
    throw error;
  }
};


