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

// Generate embedding for the query using Jina AI
async function generateQueryEmbedding(
  text: string,
  jinaKey: string,
  openaiKey?: string
): Promise<number[]> {
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
          task: 'retrieval.query',
          input: [text],
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

  // Fallback to OpenAI if Jina fails and OpenAI key is available
  if (openaiKey) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI Embedding API error: ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  throw new Error('No embedding API available - configure JINA_API_KEY or OPENAI_API_KEY');
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
  jinaKey: string,
  openaiKey?: string
): Promise<RetrievalResponse> {
  const topK = request.topK || 10;

  // Generate query embedding
  const queryEmbedding = await generateQueryEmbedding(request.query, jinaKey, openaiKey);

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
  const jinaKey = process.env.JINA_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!jinaKey && !openaiKey) {
    throw new Error('No embedding API configured - set JINA_API_KEY or OPENAI_API_KEY');
  }

  try {
    return await retrieveSources(request as RetrievalRequest, jinaKey || '', openaiKey);
  } catch (error) {
    console.error('RAG Retrieval error:', error);
    throw error;
  }
};


