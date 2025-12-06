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

// Follow links for shallow crawl (1 level deep)
async function extractLinks(content: string, baseUrl: string): Promise<string[]> {
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links: string[] = [];
  let match;

  while ((match = linkPattern.exec(content)) !== null) {
    const href = match[2];
    if (href.startsWith('http')) {
      links.push(href);
    } else if (href.startsWith('/')) {
      try {
        const base = new URL(baseUrl);
        links.push(`${base.origin}${href}`);
      } catch {
        // Invalid URL, skip
      }
    }
  }

  // Filter to same domain and relevant paths
  const baseOrigin = new URL(baseUrl).origin;
  return links
    .filter((link) => {
      try {
        const url = new URL(link);
        return url.origin === baseOrigin;
      } catch {
        return false;
      }
    })
    .slice(0, 5); // Limit to 5 links per page
}

// Generate embedding for content
async function generateEmbedding(
  text: string,
  apiKey: string
): Promise<number[]> {
  // Chunk text if too long (max ~8000 tokens for embedding)
  const truncatedText = text.slice(0, 20000);

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
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

// Main discovery function
async function discoverSources(
  request: DiscoveryRequest,
  braveKey: string,
  jinaKey: string,
  openaiKey: string
): Promise<DiscoveryResponse> {
  const maxSources = request.maxSources || 25;
  const sources: DiscoveredSource[] = [];
  const errors: string[] = [];
  const processedUrls = new Set<string>();

  // Step 1: Search Brave for sources
  console.log(`Searching Brave for: ${request.query}`);
  const searchResults = await searchBrave(request.query, braveKey, 10);
  console.log(`Found ${searchResults.length} search results`);

  // Step 2: Process each result (with retry logic)
  for (const result of searchResults) {
    if (sources.length >= maxSources) break;
    if (processedUrls.has(result.url)) continue;
    processedUrls.add(result.url);

    let content = '';
    let retries = 0;
    const maxRetries = 1;

    while (retries <= maxRetries && !content) {
      try {
        console.log(`Extracting content from: ${result.url} (attempt ${retries + 1})`);
        content = await extractContent(result.url, jinaKey);
      } catch (err) {
        console.warn(`Retry ${retries + 1} failed for ${result.url}`);
        retries++;
      }
    }

    if (!content) {
      errors.push(`Failed to extract content from ${result.url}`);
      continue;
    }

    // Step 3: Shallow crawl - extract and process linked pages
    const links = await extractLinks(content, result.url);
    console.log(`Found ${links.length} links to crawl from ${result.url}`);

    // Process main page
    const chunks = chunkContent(content);
    for (let i = 0; i < chunks.length && sources.length < maxSources; i++) {
      try {
        const embedding = await generateEmbedding(chunks[i], openaiKey);
        sources.push({
          url: result.url,
          title: result.title,
          snippet: result.snippet,
          content: chunks[i],
          embedding,
        });
      } catch (err) {
        errors.push(`Failed to embed chunk from ${result.url}`);
      }
    }

    // Process linked pages (shallow crawl)
    for (const link of links) {
      if (sources.length >= maxSources) break;
      if (processedUrls.has(link)) continue;
      processedUrls.add(link);

      try {
        const linkedContent = await extractContent(link, jinaKey);
        if (linkedContent) {
          const linkedChunks = chunkContent(linkedContent);
          for (let i = 0; i < Math.min(linkedChunks.length, 2) && sources.length < maxSources; i++) {
            const embedding = await generateEmbedding(linkedChunks[i], openaiKey);
            sources.push({
              url: link,
              title: `${result.title} (linked)`,
              snippet: linkedChunks[i].slice(0, 200),
              content: linkedChunks[i],
              embedding,
            });
          }
        }
      } catch (err) {
        // Skip failed linked pages
        console.warn(`Failed to process linked page: ${link}`);
      }
    }
  }

  return {
    sources,
    query: request.query,
    totalFound: searchResults.length,
    indexed: sources.length,
    errors,
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

// Get jurisdiction key from country
function getJurisdictionKey(jurisdiction: string): string {
  const euCountries = ['Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Austria', 'Poland', 'Sweden', 'Denmark', 'Finland', 'Ireland', 'Portugal', 'Greece'];
  if (jurisdiction === 'United States' || jurisdiction === 'USA') return 'USA';
  if (euCountries.includes(jurisdiction)) return 'EU';
  return 'USA'; // Default to USA sources
}

// Fallback discovery using curated sources only
async function discoverFromCuratedSources(
  request: DiscoveryRequest,
  jinaKey: string,
  openaiKey: string
): Promise<DiscoveryResponse> {
  const maxSources = request.maxSources || 25;
  const sources: DiscoveredSource[] = [];
  const errors: string[] = [];

  const jurisdictionKey = getJurisdictionKey(request.jurisdiction);
  const curatedForJurisdiction = CURATED_SOURCES[jurisdictionKey] || CURATED_SOURCES['USA'];
  const categoryUrls = curatedForJurisdiction[request.category] || [];

  console.log(`Using curated sources for ${jurisdictionKey}/${request.category}: ${categoryUrls.length} sources`);

  for (const source of categoryUrls) {
    if (sources.length >= maxSources) break;

    try {
      let content = '';

      // Try Jina Reader if key available
      if (jinaKey) {
        try {
          content = await extractContent(source.url, jinaKey);
        } catch {
          console.warn(`Jina extraction failed for ${source.url}`);
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
          const embedding = await generateEmbedding(chunks[i], openaiKey);
          sources.push({
            url: source.url,
            title: source.title,
            snippet: chunks[i].slice(0, 200),
            content: chunks[i],
            embedding,
          });
        } catch (err) {
          errors.push(`Failed to embed chunk from ${source.url}`);
        }
      }
    } catch (err) {
      errors.push(`Failed to process ${source.url}`);
    }
  }

  return {
    sources,
    query: request.query,
    totalFound: categoryUrls.length,
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

  if (!openaiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  // Jina key is optional
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


