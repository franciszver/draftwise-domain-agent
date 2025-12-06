import type { Handler } from 'aws-lambda';

interface RetrievalRequest {
  query: string;
  domainId: string;
  topK?: number;
  categories?: string[];
}

interface RetrievalResult {
  sourceId: string;
  url: string;
  title: string;
  content: string;
  category: string;
  similarity: number;
}

interface RetrievalResponse {
  results: RetrievalResult[];
  query: string;
  totalSources: number;
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Generate embedding for the query
async function generateQueryEmbedding(
  text: string,
  apiKey: string
): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Fetch sources from DynamoDB (simplified - in production use proper SDK)
async function fetchSources(
  domainId: string,
  categories?: string[]
): Promise<Array<{
  id: string;
  url: string;
  title: string;
  content: string;
  category: string;
  embedding: number[];
}>> {
  // This would be replaced with actual DynamoDB query
  // For now, return empty array - sources will be populated by source-discovery function
  console.log('Fetching sources for domain:', domainId, 'categories:', categories);
  return [];
}

// Main retrieval function
async function retrieveSources(
  request: RetrievalRequest,
  apiKey: string
): Promise<RetrievalResponse> {
  const topK = request.topK || 10;

  // Generate query embedding
  const queryEmbedding = await generateQueryEmbedding(request.query, apiKey);

  // Fetch all sources for the domain
  const sources = await fetchSources(request.domainId, request.categories);

  if (sources.length === 0) {
    return {
      results: [],
      query: request.query,
      totalSources: 0,
    };
  }

  // Calculate similarities and rank
  const rankedSources = sources
    .map((source) => ({
      ...source,
      similarity: cosineSimilarity(queryEmbedding, source.embedding),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  // Format results
  const results: RetrievalResult[] = rankedSources.map((source) => ({
    sourceId: source.id,
    url: source.url,
    title: source.title,
    content: source.content.slice(0, 1000), // Truncate for response
    category: source.category,
    similarity: source.similarity,
  }));

  return {
    results,
    query: request.query,
    totalSources: sources.length,
  };
}

// Main handler
export const handler: Handler = async (event) => {
  const request = event.arguments || event;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    return await retrieveSources(request as RetrievalRequest, apiKey);
  } catch (error) {
    console.error('RAG Retrieval error:', error);
    throw error;
  }
};


