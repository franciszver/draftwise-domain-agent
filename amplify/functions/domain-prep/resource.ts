import { defineFunction, secret } from '@aws-amplify/backend';

export const domainPrep = defineFunction({
  name: 'domain-prep',
  entry: './handler.ts',
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
    // BRAVE_API_KEY is optional - will use curated sources if not set
  },
  timeoutSeconds: 300,
  memoryMB: 1024,
});


