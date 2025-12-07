// API service layer for backend Lambda function calls
// Uses Amplify Data client for GraphQL operations

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

// Create the Amplify Data client
let client: ReturnType<typeof generateClient<Schema>> | null = null;

function getClient() {
  if (!client) {
    try {
      client = generateClient<Schema>();
    } catch (error) {
      console.warn('Amplify client not available - using mock mode');
      return null;
    }
  }
  return client;
}

// Check if backend is available
export function isBackendAvailable(): boolean {
  try {
    const c = getClient();
    return c !== null;
  } catch {
    return false;
  }
}

// ----- Source Discovery -----

export interface DiscoveryRequest {
  domainId: string;
  query: string;
  jurisdiction: string;
  category: string;
  maxSources?: number;
}

export interface DiscoveredSource {
  url: string;
  title: string;
  snippet: string;
  content?: string;
  jurisdictionLevel?: 'federal' | 'state' | 'local';
}

export interface DiscoveryResponse {
  sources: DiscoveredSource[];
  query: string;
  totalFound: number;
  indexed: number;
  errors: string[];
}

export async function discoverSources(request: DiscoveryRequest): Promise<DiscoveryResponse> {
  const c = getClient();

  if (!c) {
    throw new Error('Backend not available');
  }

  // Call the sourceDiscovery custom query
  const response = await c.queries.discoverSources({
    domainId: request.domainId,
    query: request.query,
    jurisdiction: request.jurisdiction,
    category: request.category,
    maxSources: request.maxSources || 25,
  });

  if (response.errors && response.errors.length > 0) {
    throw new Error(response.errors.map(e => e.message).join(', '));
  }

  if (!response.data) {
    throw new Error('No data returned from source discovery');
  }

  // GraphQL returns JSON as a string, need to parse it
  const data = typeof response.data === 'string'
    ? JSON.parse(response.data)
    : response.data;

  return data as DiscoveryResponse;
}

// ----- RAG Retrieval -----

export interface RetrievalRequest {
  query: string;
  domainId: string;
  topK?: number;
  categories?: string[];
}

export interface RetrievalResult {
  sourceId: string;
  url: string;
  title: string;
  content: string;
  category: string;
  similarity: number;
}

export interface RetrievalResponse {
  results: RetrievalResult[];
  query: string;
  totalSources: number;
}

export async function retrieveSources(request: RetrievalRequest): Promise<RetrievalResponse> {
  const c = getClient();

  if (!c) {
    throw new Error('Backend not available');
  }

  const response = await c.queries.retrieveSources({
    query: request.query,
    domainId: request.domainId,
    topK: request.topK || 10,
    categories: request.categories,
  });

  if (response.errors && response.errors.length > 0) {
    throw new Error(response.errors.map(e => e.message).join(', '));
  }

  if (!response.data) {
    throw new Error('No data returned from source retrieval');
  }

  // GraphQL returns JSON as a string, need to parse it
  const data = typeof response.data === 'string'
    ? JSON.parse(response.data)
    : response.data;

  return data as RetrievalResponse;
}

// ----- Suggestion Generation -----

export interface SignalValues {
  formality: 'casual' | 'moderate' | 'formal';
  riskAppetite: 'conservative' | 'moderate' | 'aggressive';
  complianceStrictness: 'lenient' | 'standard' | 'full';
}

export interface GenerationRequest {
  documentId: string;
  documentContent: string;
  domainId: string;
  signals: SignalValues;
  approverPov?: string;
  suggestionCount?: number;
  retrievedSources?: Array<{
    url: string;
    title: string;
    content: string;
    category: string;
  }>;
}

export interface GeneratedSuggestion {
  id: string;
  type: 'structured' | 'narrative';
  title: string;
  content: string;
  sourceRefs: string[];
  confidence: number;
}

export interface GenerationResponse {
  suggestions: GeneratedSuggestion[];
  documentId: string;
  generatedAt: string;
}

export async function generateSuggestions(request: GenerationRequest): Promise<GenerationResponse> {
  const c = getClient();

  if (!c) {
    throw new Error('Backend not available');
  }

  const response = await c.queries.generateSuggestions({
    documentId: request.documentId,
    documentContent: request.documentContent,
    domainId: request.domainId,
    signals: JSON.stringify(request.signals),
    approverPov: request.approverPov,
    suggestionCount: request.suggestionCount || 5,
    retrievedSources: request.retrievedSources ? JSON.stringify(request.retrievedSources) : undefined,
  });

  if (response.errors && response.errors.length > 0) {
    throw new Error(response.errors.map(e => e.message).join(', '));
  }

  if (!response.data) {
    throw new Error('No data returned from suggestion generation');
  }

  // GraphQL returns JSON as a string, need to parse it
  const data = typeof response.data === 'string'
    ? JSON.parse(response.data)
    : response.data;

  return data as GenerationResponse;
}

// ----- Data Model Operations -----

// Create a regulatory source in the database
export async function createRegulatorySource(source: {
  domainId: string;
  url: string;
  title: string;
  content?: string;
  category: string;
  jurisdiction: string;
  status: 'pending' | 'fetching' | 'indexed' | 'error';
}) {
  const c = getClient();
  if (!c) throw new Error('Backend not available');

  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  const response = await c.models.RegulatorySource.create({
    ...source,
    fetchedAt: now,
    expiresAt,
  });

  return response.data;
}

// Get sources for a domain
export async function getSourcesByDomain(domainId: string) {
  const c = getClient();
  if (!c) throw new Error('Backend not available');

  const response = await c.models.RegulatorySource.list({
    filter: { domainId: { eq: domainId } },
  });

  return response.data;
}

// Delete a regulatory source
export async function deleteRegulatorySource(id: string) {
  const c = getClient();
  if (!c) throw new Error('Backend not available');

  await c.models.RegulatorySource.delete({ id });
}

// Create/Update domain in database
export async function saveDomain(domain: {
  id: string;
  country: string;
  site?: string;
  assetClass: string;
  selectedCategories: string[];
  prepStatus: 'pending' | 'preparing' | 'ready' | 'error';
  prepProgress: number;
  citationsIndexed: number;
}) {
  const c = getClient();
  if (!c) throw new Error('Backend not available');

  // Try to update first, create if not exists
  try {
    const response = await c.models.Domain.update({
      id: domain.id,
      country: domain.country,
      site: domain.site,
      assetClass: domain.assetClass,
      selectedCategories: domain.selectedCategories,
      prepStatus: domain.prepStatus,
      prepProgress: domain.prepProgress,
      citationsIndexed: domain.citationsIndexed,
      lastPreparedAt: domain.prepStatus === 'ready' ? new Date().toISOString() : undefined,
    });
    return response.data;
  } catch {
    // Create new domain
    const response = await c.models.Domain.create({
      id: domain.id,
      country: domain.country,
      site: domain.site,
      assetClass: domain.assetClass,
      selectedCategories: domain.selectedCategories,
      prepStatus: domain.prepStatus,
      prepProgress: domain.prepProgress,
      citationsIndexed: domain.citationsIndexed,
      createdAt: new Date().toISOString(),
    });
    return response.data;
  }
}

// ----- Document Upload -----

export interface UploadRequest {
  domainId: string;
  fileName: string;
  fileType: string;
  fileContent: string; // base64 encoded
}

export interface UploadedSource {
  id: string;
  url: string;
  title: string;
  content: string;
  category: string;
}

export interface UploadResponse {
  success: boolean;
  source?: UploadedSource;
  error?: string;
}

export async function uploadDocument(request: UploadRequest): Promise<UploadResponse> {
  const c = getClient();

  if (!c) {
    throw new Error('Backend not available');
  }

  const response = await c.queries.uploadDocument({
    domainId: request.domainId,
    fileName: request.fileName,
    fileType: request.fileType,
    fileContent: request.fileContent,
  });

  if (response.errors && response.errors.length > 0) {
    throw new Error(response.errors.map(e => e.message).join(', '));
  }

  if (!response.data) {
    throw new Error('No data returned from document upload');
  }

  // GraphQL returns JSON as a string, need to parse it
  const data = typeof response.data === 'string'
    ? JSON.parse(response.data)
    : response.data;

  return data as UploadResponse;
}
