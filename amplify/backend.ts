import { defineBackend } from '@aws-amplify/backend';
import { data } from './data/resource';
import { aiService } from './functions/ai-service/resource';
import { ragRetrieval } from './functions/rag-retrieval/resource';
import { suggestionGenerator } from './functions/suggestion-generator/resource';
import { domainPrep } from './functions/domain-prep/resource';
import { sourceDiscovery } from './functions/source-discovery/resource';
import { shareLink } from './functions/share-link/resource';
import { retentionCleanup } from './functions/retention-cleanup/resource';

const backend = defineBackend({
  data,
  aiService,
  ragRetrieval,
  suggestionGenerator,
  domainPrep,
  sourceDiscovery,
  shareLink,
  retentionCleanup,
});

// Configure additional AWS resources
const { cfnResources } = backend.data.resources;

// Add custom outputs for the frontend
backend.addOutput({
  custom: {
    region: backend.stack.region,
  },
});

export { backend };

