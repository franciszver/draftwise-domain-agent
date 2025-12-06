import { defineFunction, secret } from '@aws-amplify/backend';

export const ragRetrieval = defineFunction({
  name: 'rag-retrieval',
  entry: './handler.ts',
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
  },
  timeoutSeconds: 120,
  memoryMB: 1024,
});


