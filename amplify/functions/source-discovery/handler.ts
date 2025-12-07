import type { Handler } from 'aws-lambda';

interface DiscoveryRequest {
  domainId: string;
  query: string;
  jurisdiction: string;
  category: string;
  maxSources?: number;
}

interface DiscoveredSource {
  url: string;
  title: string;
  snippet: string;
  content?: string;
  embedding?: number[];
  jurisdictionLevel?: 'federal' | 'state' | 'local'; // Tag for source level
}

interface DiscoveryResponse {
  sources: DiscoveredSource[];
  query: string;
  totalFound: number;
  indexed: number;
  errors: string[];
}

// Search using Brave Search API
async function searchBrave(
  query: string,
  apiKey: string,
  count: number = 10
): Promise<Array<{ url: string; title: string; snippet: string }>> {
  const endpoint = 'https://api.search.brave.com/res/v1/web/search';
  const params = new URLSearchParams({
    q: query,
    count: count.toString(),
    safesearch: 'strict',
  });

  const response = await fetch(`${endpoint}?${params}`, {
    headers: {
      'X-Subscription-Token': apiKey,
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Brave API error: ${error}`);
  }

  const data = await response.json();
  const results = data.web?.results || [];

  return results.map((r: { url: string; title: string; description: string }) => ({
    url: r.url,
    title: r.title,
    snippet: r.description || '',
  }));
}

// Extract content using Jina Reader API
async function extractContent(
  url: string,
  apiKey: string
): Promise<string> {
  const readerUrl = `https://r.jina.ai/${url}`;

  const response = await fetch(readerUrl, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'text/markdown',
    },
  });

  if (!response.ok) {
    // Return empty string on failure, will be handled in retry logic
    console.warn(`Failed to extract content from ${url}`);
    return '';
  }

  const content = await response.text();
  return content.slice(0, 10000); // Limit content size
}

// Generate embedding for content using Jina AI (primary) or OpenAI (fallback)
async function generateEmbedding(
  text: string,
  jinaKey: string,
  openaiKey?: string
): Promise<number[]> {
  // Chunk text if too long
  const truncatedText = text.slice(0, 20000);

  // Try Jina first (free tier available)
  if (jinaKey) {
    try {
      const response = await fetch('https://api.jina.ai/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jinaKey}`,
        },
        body: JSON.stringify({
          model: 'jina-embeddings-v3',
          task: 'retrieval.passage',
          input: [truncatedText],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.data[0].embedding;
      }
      console.warn('Jina embedding failed, trying OpenAI fallback');
    } catch (err) {
      console.warn('Jina embedding error:', err);
    }
  }

  // Fallback to OpenAI
  if (openaiKey) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: truncatedText,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI Embedding error: ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  throw new Error('No embedding API available - configure JINA_API_KEY or OPENAI_API_KEY');
}

// Semantic chunking with max size fallback
function chunkContent(
  content: string,
  maxTokens: number = 512
): string[] {
  const chunks: string[] = [];

  // Split by paragraphs first (semantic boundaries)
  const paragraphs = content.split(/\n\n+/);
  let currentChunk = '';

  for (const para of paragraphs) {
    // Rough token estimate (4 chars per token)
    const estimatedTokens = (currentChunk.length + para.length) / 4;

    if (estimatedTokens > maxTokens && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // If any chunk is still too long, split by sentences
  const finalChunks: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length / 4 > maxTokens) {
      const sentences = chunk.split(/(?<=[.!?])\s+/);
      let subChunk = '';
      for (const sentence of sentences) {
        if ((subChunk.length + sentence.length) / 4 > maxTokens && subChunk) {
          finalChunks.push(subChunk.trim());
          subChunk = sentence;
        } else {
          subChunk += ' ' + sentence;
        }
      }
      if (subChunk.trim()) {
        finalChunks.push(subChunk.trim());
      }
    } else {
      finalChunks.push(chunk);
    }
  }

  return finalChunks;
}

// Normalize URL for deduplication
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove trailing slashes, fragments, and normalize
    return `${parsed.origin}${parsed.pathname.replace(/\/$/, '')}`.toLowerCase();
  } catch {
    return url.toLowerCase().replace(/\/$/, '');
  }
}

// Extract state from jurisdiction string (e.g., "United States Texas" -> "Texas")
function extractState(jurisdiction: string): string | null {
  const usStates = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
    'Wisconsin', 'Wyoming'
  ];

  for (const state of usStates) {
    if (jurisdiction.includes(state)) {
      return state;
    }
  }
  return null;
}

// Single search helper that tags results with jurisdiction level
// Each search maintains its own URL tracking to avoid cross-contamination
async function searchAndProcess(
  query: string,
  jurisdictionLevel: 'federal' | 'state',
  braveKey: string,
  jinaKey: string,
  openaiKey: string | undefined,
  maxSources: number
): Promise<{ sources: DiscoveredSource[]; errors: string[] }> {
  const sources: DiscoveredSource[] = [];
  const errors: string[] = [];
  const processedUrls = new Set<string>(); // Each search has its own URL tracking

  console.log(`[Search ${jurisdictionLevel}] Query: ${query}`);

  try {
    const searchResults = await searchBrave(query, braveKey, 10);
    console.log(`[Search ${jurisdictionLevel}] Found ${searchResults.length} results`);

    for (const result of searchResults) {
      if (sources.length >= maxSources) break;

      const normalizedUrl = normalizeUrl(result.url);
      if (processedUrls.has(normalizedUrl)) {
        console.log(`[Search ${jurisdictionLevel}] Skipping duplicate: ${result.url}`);
        continue;
      }
      processedUrls.add(normalizedUrl);

      let content = '';
      try {
        content = await extractContent(result.url, jinaKey);
      } catch {
        console.warn(`[Search ${jurisdictionLevel}] Failed to extract: ${result.url}`);
      }

      if (!content) {
        errors.push(`Failed to extract content from ${result.url}`);
        continue;
      }

      const chunks = chunkContent(content);
      for (let i = 0; i < Math.min(chunks.length, 3) && sources.length < maxSources; i++) {
        try {
          const embedding = await generateEmbedding(chunks[i], jinaKey, openaiKey);
          sources.push({
            url: result.url,
            title: result.title,
            snippet: result.snippet,
            content: chunks[i],
            embedding,
            jurisdictionLevel,
          });
          console.log(`[Search ${jurisdictionLevel}] Indexed: "${result.title}"`);
        } catch (err) {
          errors.push(`Failed to embed chunk from ${result.url}`);
        }
      }
    }
  } catch (err) {
    console.error(`[Search ${jurisdictionLevel}] Search failed:`, err);
    errors.push(`Search failed for ${jurisdictionLevel} query`);
  }

  return { sources, errors };
}

// Main discovery function - runs parallel country + state searches when applicable
async function discoverSources(
  request: DiscoveryRequest,
  braveKey: string,
  jinaKey: string,
  openaiKey?: string
): Promise<DiscoveryResponse> {
  const maxSources = request.maxSources || 25;
  const allErrors: string[] = [];

  console.log(`[Source Discovery] Starting discovery for: ${request.jurisdiction}`);
  console.log(`[Source Discovery] Category: ${request.category}`);
  console.log(`[Source Discovery] Original query: ${request.query}`);

  // Detect if we have a state-level jurisdiction
  const state = extractState(request.jurisdiction);
  const hasState = !!state;

  let combinedSources: DiscoveredSource[] = [];

  if (hasState) {
    console.log(`[Source Discovery] Detected state: ${state} - running parallel federal + state searches`);

    // Build separate queries for federal and state
    // Use more distinct queries to get different results
    const federalQuery = `${request.query.replace(state, '').trim()} federal law regulations`;
    const stateQuery = `${state} ${request.category} state law regulations requirements`;

    console.log(`[Source Discovery] Federal query: ${federalQuery}`);
    console.log(`[Source Discovery] State query: ${stateQuery}`);

    // Run both searches in parallel - each has its own URL tracking
    const halfMax = Math.ceil(maxSources / 2);
    const [federalResult, stateResult] = await Promise.all([
      searchAndProcess(federalQuery, 'federal', braveKey, jinaKey, openaiKey, halfMax),
      searchAndProcess(stateQuery, 'state', braveKey, jinaKey, openaiKey, halfMax),
    ]);

    console.log(`[Source Discovery] Federal sources: ${federalResult.sources.length}`);
    console.log(`[Source Discovery] State sources: ${stateResult.sources.length}`);

    allErrors.push(...federalResult.errors);
    allErrors.push(...stateResult.errors);

    // Combine and deduplicate - prefer state sources for overlapping URLs
    // (state-specific info is more relevant when user selected a state)
    const seenUrls = new Set<string>();

    // Add state sources first (they take priority for duplicates)
    for (const source of stateResult.sources) {
      const normalizedUrl = normalizeUrl(source.url);
      if (!seenUrls.has(normalizedUrl)) {
        seenUrls.add(normalizedUrl);
        combinedSources.push(source);
        console.log(`[Source Discovery] Added state source: "${source.title}"`);
      }
    }

    // Then add federal sources (skip if URL already from state)
    for (const source of federalResult.sources) {
      const normalizedUrl = normalizeUrl(source.url);
      if (!seenUrls.has(normalizedUrl)) {
        seenUrls.add(normalizedUrl);
        combinedSources.push(source);
        console.log(`[Source Discovery] Added federal source: "${source.title}"`);
      } else {
        console.log(`[Source Discovery] Skipping federal duplicate: "${source.title}"`);
      }
    }
  } else {
    // No state - just do country-level search
    console.log(`[Source Discovery] Country-level search only`);

    const result = await searchAndProcess(
      request.query,
      'federal',
      braveKey,
      jinaKey,
      openaiKey,
      maxSources
    );

    combinedSources = result.sources;
    allErrors.push(...result.errors);
  }

  // Cap at maxSources
  const finalSources = combinedSources.slice(0, maxSources);

  // Log final breakdown
  const federalCount = finalSources.filter(s => s.jurisdictionLevel === 'federal').length;
  const stateCount = finalSources.filter(s => s.jurisdictionLevel === 'state').length;
  console.log(`[Source Discovery] Complete! Total: ${finalSources.length} (${federalCount} federal, ${stateCount} state)`);

  if (allErrors.length > 0) {
    console.log(`[Source Discovery] Errors: ${allErrors.length}`);
  }

  return {
    sources: finalSources,
    query: request.query,
    totalFound: combinedSources.length,
    indexed: finalSources.length,
    errors: allErrors,
  };
}

// Curated regulatory sources by jurisdiction and category
const CURATED_SOURCES: Record<string, Record<string, Array<{ url: string; title: string }>>> = {
  USA: {
    environmental: [
      { url: 'https://www.epa.gov/laws-regulations', title: 'EPA Laws & Regulations' },
      { url: 'https://www.epa.gov/regulatory-information-sector', title: 'EPA Sector Regulations' },
    ],
    data_privacy: [
      { url: 'https://www.ftc.gov/business-guidance/privacy-security', title: 'FTC Privacy & Security' },
      { url: 'https://www.hhs.gov/hipaa/for-professionals/index.html', title: 'HHS HIPAA Guide' },
    ],
    financial: [
      { url: 'https://www.sec.gov/rules', title: 'SEC Rules' },
    ],
    safety_workforce: [
      { url: 'https://www.osha.gov/laws-regs', title: 'OSHA Laws & Regulations' },
    ],
    legal_contractual: [
      { url: 'https://www.law.cornell.edu/uscode', title: 'US Code - Cornell Law' },
    ],
  },
  // Texas-specific sources
  'USA-Texas': {
    environmental: [
      { url: 'https://www.tceq.texas.gov/rules', title: 'Texas Commission on Environmental Quality Rules' },
      { url: 'https://www.tceq.texas.gov/permitting/air', title: 'TCEQ Air Quality Permits' },
      { url: 'https://www.epa.gov/laws-regulations', title: 'EPA Laws & Regulations' },
    ],
    data_privacy: [
      { url: 'https://capitol.texas.gov/BillLookup/History.aspx?LegSess=88R&Bill=HB4', title: 'Texas Data Privacy Act' },
      { url: 'https://www.ftc.gov/business-guidance/privacy-security', title: 'FTC Privacy & Security' },
      { url: 'https://www.hhs.gov/hipaa/for-professionals/index.html', title: 'HHS HIPAA Guide' },
    ],
    financial: [
      { url: 'https://www.sec.gov/rules', title: 'SEC Rules' },
      { url: 'https://www.finance.texas.gov/', title: 'Texas Dept of Banking' },
    ],
    safety_workforce: [
      { url: 'https://www.twc.texas.gov/', title: 'Texas Workforce Commission' },
      { url: 'https://www.osha.gov/laws-regs', title: 'OSHA Laws & Regulations' },
    ],
    legal_contractual: [
      { url: 'https://statutes.capitol.texas.gov/', title: 'Texas Statutes' },
      { url: 'https://www.law.cornell.edu/uscode', title: 'US Code - Cornell Law' },
    ],
  },
  EU: {
    environmental: [
      { url: 'https://environment.ec.europa.eu/law-and-governance_en', title: 'EU Environmental Law' },
    ],
    data_privacy: [
      { url: 'https://gdpr.eu/', title: 'GDPR.eu Guide' },
      { url: 'https://edpb.europa.eu/edpb_en', title: 'European Data Protection Board' },
    ],
    financial: [
      { url: 'https://www.esma.europa.eu/rules-databases-library/rules-database', title: 'ESMA Rules Database' },
    ],
    safety_workforce: [
      { url: 'https://osha.europa.eu/en/legislation', title: 'EU-OSHA Legislation' },
    ],
    legal_contractual: [
      { url: 'https://eur-lex.europa.eu/homepage.html', title: 'EUR-Lex' },
    ],
  },
};

// Fallback discovery using curated sources only - merges country + state sources
async function discoverFromCuratedSources(
  request: DiscoveryRequest,
  jinaKey: string,
  openaiKey?: string
): Promise<DiscoveryResponse> {
  const maxSources = request.maxSources || 25;
  const sources: DiscoveredSource[] = [];
  const errors: string[] = [];
  const processedUrls = new Set<string>();

  console.log(`[Curated Discovery] Starting for jurisdiction: ${request.jurisdiction}`);
  console.log(`[Curated Discovery] Category: ${request.category}`);

  // Detect state and get both country + state sources
  const state = extractState(request.jurisdiction);
  const stateKey = state ? `USA-${state}` : null;

  // Collect sources from both federal and state levels
  interface CuratedSource { url: string; title: string; level: 'federal' | 'state' }
  const allCuratedSources: CuratedSource[] = [];

  // Always add federal/country sources
  const federalSources = CURATED_SOURCES['USA']?.[request.category] || [];
  federalSources.forEach(s => {
    allCuratedSources.push({ ...s, level: 'federal' });
  });
  console.log(`[Curated Discovery] Federal sources: ${federalSources.length}`);

  // Add state-specific sources if available
  if (stateKey && CURATED_SOURCES[stateKey]) {
    const stateSources = CURATED_SOURCES[stateKey][request.category] || [];
    stateSources.forEach(s => {
      // Avoid duplicates (state sources might include federal ones)
      const normalizedUrl = normalizeUrl(s.url);
      if (!allCuratedSources.some(existing => normalizeUrl(existing.url) === normalizedUrl)) {
        allCuratedSources.push({ ...s, level: 'state' });
      }
    });
    console.log(`[Curated Discovery] State (${state}) sources: ${stateSources.length}`);
  }

  console.log(`[Curated Discovery] Total curated sources to process: ${allCuratedSources.length}`);

  for (const source of allCuratedSources) {
    if (sources.length >= maxSources) break;

    // Skip duplicates
    const normalizedUrl = normalizeUrl(source.url);
    if (processedUrls.has(normalizedUrl)) {
      console.log(`[Curated Discovery] Skipping duplicate: ${source.url}`);
      continue;
    }
    processedUrls.add(normalizedUrl);

    try {
      let content = '';

      // Try Jina Reader if key available
      if (jinaKey) {
        try {
          content = await extractContent(source.url, jinaKey);
          console.log(`[Curated Discovery] Extracted content from: ${source.title}`);
        } catch {
          console.warn(`[Curated Discovery] Jina extraction failed for ${source.url}`);
        }
      }

      // If no content, create a placeholder
      if (!content) {
        content = `Regulatory source: ${source.title}\nURL: ${source.url}\n\nThis source should be consulted directly for authoritative regulatory information.`;
      }

      // Generate embedding
      const chunks = chunkContent(content);
      for (let i = 0; i < Math.min(chunks.length, 3) && sources.length < maxSources; i++) {
        try {
          const embedding = await generateEmbedding(chunks[i], jinaKey, openaiKey);
          sources.push({
            url: source.url,
            title: source.title,
            snippet: chunks[i].slice(0, 200),
            content: chunks[i],
            embedding,
            jurisdictionLevel: source.level,
          });
          console.log(`[Curated Discovery] Indexed: "${source.title}" (${source.level})`);
        } catch (err) {
          errors.push(`Failed to embed chunk from ${source.url}`);
        }
      }
    } catch (err) {
      errors.push(`Failed to process ${source.url}`);
    }
  }

  console.log(`[Curated Discovery] Complete! Indexed ${sources.length} sources`);

  return {
    sources,
    query: request.query,
    totalFound: allCuratedSources.length,
    indexed: sources.length,
    errors,
  };
}

// Main handler
export const handler: Handler = async (event) => {
  const request = event.arguments || event;
  const braveKey = process.env.BRAVE_API_KEY;
  const jinaKey = process.env.JINA_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // Need at least one embedding API
  if (!jinaKey && !openaiKey) {
    throw new Error('No embedding API configured - set JINA_API_KEY or OPENAI_API_KEY');
  }

  // Jina is preferred for embeddings (free tier)
  const effectiveJinaKey = jinaKey || '';

  try {
    // If Brave API key is available, use full discovery
    if (braveKey) {
      return await discoverSources(
        request as DiscoveryRequest,
        braveKey,
        effectiveJinaKey,
        openaiKey
      );
    }

    // Otherwise, fall back to curated sources
    console.log('BRAVE_API_KEY not configured, using curated sources only');
    return await discoverFromCuratedSources(
      request as DiscoveryRequest,
      effectiveJinaKey,
      openaiKey
    );
  } catch (error) {
    console.error('Source discovery error:', error);
    throw error;
  }
};


