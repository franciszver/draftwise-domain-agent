import type { Handler } from 'aws-lambda';

// AI Provider Types
interface CompletionRequest {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  provider?: 'openai' | 'openrouter';
}

interface CompletionResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface EmbeddingRequest {
  text: string;
  model?: string;
}

interface EmbeddingResponse {
  embedding: number[];
  model: string;
  dimensions: number;
}

// OpenAI API client
async function callOpenAI(
  endpoint: string,
  body: Record<string, unknown>,
  apiKey: string
): Promise<Response> {
  return fetch(`https://api.openai.com/v1/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
}

// OpenRouter API client
async function callOpenRouter(
  body: Record<string, unknown>,
  apiKey: string
): Promise<Response> {
  return fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://draftwise.app',
      'X-Title': 'DraftWise Compliance Agent',
    },
    body: JSON.stringify(body),
  });
}

// Generate completion using OpenAI
async function generateOpenAICompletion(
  request: CompletionRequest,
  apiKey: string
): Promise<CompletionResponse> {
  const model = request.model || 'gpt-4o';
  const messages = [
    ...(request.systemPrompt
      ? [{ role: 'system', content: request.systemPrompt }]
      : []),
    { role: 'user', content: request.prompt },
  ];

  const response = await callOpenAI(
    'chat/completions',
    {
      model,
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2000,
    },
    apiKey
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    model: data.model,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    },
  };
}

// Generate completion using OpenRouter
async function generateOpenRouterCompletion(
  request: CompletionRequest,
  apiKey: string
): Promise<CompletionResponse> {
  const model = request.model || 'openai/gpt-4o';
  const messages = [
    ...(request.systemPrompt
      ? [{ role: 'system', content: request.systemPrompt }]
      : []),
    { role: 'user', content: request.prompt },
  ];

  const response = await callOpenRouter(
    {
      model,
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2000,
    },
    apiKey
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    model: data.model,
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
  };
}

// Generate embedding using OpenAI
async function generateEmbedding(
  request: EmbeddingRequest,
  apiKey: string
): Promise<EmbeddingResponse> {
  const model = request.model || 'text-embedding-3-small';

  const response = await callOpenAI(
    'embeddings',
    {
      model,
      input: request.text,
    },
    apiKey
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI Embedding API error: ${error}`);
  }

  const data = await response.json();
  return {
    embedding: data.data[0].embedding,
    model: data.model,
    dimensions: data.data[0].embedding.length,
  };
}

// Main handler
export const handler: Handler = async (event) => {
  const { action, ...params } = event.arguments || event;
  const openaiKey = process.env.OPENAI_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;

  if (!openaiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    switch (action) {
      case 'completion': {
        const request = params as CompletionRequest;
        if (request.provider === 'openrouter' && openrouterKey) {
          return await generateOpenRouterCompletion(request, openrouterKey);
        }
        return await generateOpenAICompletion(request, openaiKey);
      }

      case 'embedding': {
        const request = params as EmbeddingRequest;
        return await generateEmbedding(request, openaiKey);
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('AI Service error:', error);
    throw error;
  }
};


