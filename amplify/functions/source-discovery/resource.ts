import { defineFunction, secret } from '@aws-amplify/backend';

export const sourceDiscovery = defineFunction({
  name: 'source-discovery',
  entry: './handler.ts',
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
    BRAVE_API_KEY: secret('BRAVE_API_KEY'),
    JINA_API_KEY: secret('JINA_API_KEY'),
  },
  timeoutSeconds: 300,
  memoryMB: 2048,
});


