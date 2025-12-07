import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { sourceDiscovery } from '../functions/source-discovery/resource';
import { ragRetrieval } from '../functions/rag-retrieval/resource';
import { suggestionGenerator } from '../functions/suggestion-generator/resource';

const schema = a.schema({
  // Document - Main planning document
  Document: a
    .model({
      id: a.id().required(),
      title: a.string().required(),
      content: a.string(), // Lexical JSON state
      status: a.enum(['draft', 'review', 'final']),
      domainId: a.id(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      lastAutosaveAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // Snapshot - Document revision snapshots
  Snapshot: a
    .model({
      id: a.id().required(),
      documentId: a.id().required(),
      content: a.string().required(),
      title: a.string(),
      createdAt: a.datetime().required(),
      isAutoSave: a.boolean().default(false),
    })
    .authorization((allow) => [allow.publicApiKey()])
    .secondaryIndexes((index) => [
      index('documentId').sortKeys(['createdAt']).queryField('snapshotsByDocument'),
    ]),

  // Domain - Jurisdiction and source configuration
  Domain: a
    .model({
      id: a.id().required(),
      country: a.string().required(),
      site: a.string(),
      assetClass: a.string().default('Datacenter'),
      selectedCategories: a.string().array(), // Array of category IDs
      prepStatus: a.enum(['pending', 'preparing', 'ready', 'error']),
      prepProgress: a.integer().default(0),
      prepLog: a.string().array(), // Array of log messages
      citationsIndexed: a.integer().default(0),
      lastPreparedAt: a.datetime(),
      createdAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // RegulatorySource - Indexed regulatory sources for RAG
  RegulatorySource: a
    .model({
      id: a.id().required(),
      domainId: a.id().required(),
      url: a.string().required(),
      title: a.string().required(),
      content: a.string(), // Extracted markdown content
      category: a.string().required(),
      jurisdiction: a.string().required(),
      embedding: a.string(), // JSON stringified embedding vector
      chunkIndex: a.integer().default(0),
      totalChunks: a.integer().default(1),
      fetchedAt: a.datetime().required(),
      expiresAt: a.datetime().required(), // 30-day cache
      status: a.enum(['pending', 'fetching', 'indexed', 'error']),
      errorMessage: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()])
    .secondaryIndexes((index) => [
      index('domainId').sortKeys(['category']).queryField('sourcesByDomain'),
      index('jurisdiction').sortKeys(['category']).queryField('sourcesByJurisdiction'),
    ]),

  // Suggestion - AI-generated suggestions
  Suggestion: a
    .model({
      id: a.id().required(),
      documentId: a.id().required(),
      type: a.enum(['structured', 'narrative']),
      title: a.string(),
      content: a.string().required(),
      sourceRefs: a.string().array(), // Array of source URLs
      confidence: a.float(),
      pinned: a.boolean().default(false),
      superseded: a.boolean().default(false),
      povRankings: a.string(), // JSON object of POV -> rank
      signals: a.string(), // JSON object of signal values used
      createdAt: a.datetime().required(),
      refreshedAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()])
    .secondaryIndexes((index) => [
      index('documentId').sortKeys(['createdAt']).queryField('suggestionsByDocument'),
    ]),

  // ReadOnlyToken - Shareable read-only links
  ReadOnlyToken: a
    .model({
      id: a.id().required(),
      documentId: a.id().required(),
      passcode: a.string().required(),
      expiresAt: a.datetime().required(), // 72-hour TTL
      createdAt: a.datetime().required(),
      accessCount: a.integer().default(0),
      lastAccessedAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()])
    .secondaryIndexes((index) => [
      index('documentId').queryField('tokensByDocument'),
    ]),

  // AdminConfig - Application configuration (singleton)
  AdminConfig: a
    .model({
      id: a.id().required(), // Always 'default'
      passcode: a.string().required(),
      adminCode: a.string().required(),
      maxActiveSessions: a.integer().default(10),
      maxReadOnlyLinks: a.integer().default(50),
      preferredAiProvider: a.enum(['openai', 'openrouter']),
      preferredModel: a.string().default('gpt-4o'),
      retentionDays: a.integer().default(3),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // ActiveSession - Track active user sessions
  ActiveSession: a
    .model({
      id: a.id().required(),
      sessionToken: a.string().required(),
      documentId: a.id(),
      lastActivityAt: a.datetime().required(),
      expiresAt: a.datetime().required(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // Custom Queries for Lambda Functions

  // Source Discovery - Search and index regulatory sources
  discoverSources: a
    .query()
    .arguments({
      domainId: a.string().required(),
      query: a.string().required(),
      jurisdiction: a.string().required(),
      category: a.string().required(),
      maxSources: a.integer(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(sourceDiscovery)),

  // RAG Retrieval - Retrieve relevant sources for a query
  retrieveSources: a
    .query()
    .arguments({
      query: a.string().required(),
      domainId: a.string().required(),
      topK: a.integer(),
      categories: a.string().array(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(ragRetrieval)),

  // Suggestion Generator - Generate AI suggestions
  generateSuggestions: a
    .query()
    .arguments({
      documentId: a.string().required(),
      documentContent: a.string().required(),
      domainId: a.string().required(),
      signals: a.string().required(), // JSON stringified SignalValues
      approverPov: a.string(),
      retrievedSources: a.string(), // JSON stringified array
    })
    .returns(a.json())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(suggestionGenerator)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    },
  },
});


