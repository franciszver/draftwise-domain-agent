import { defineFunction, secret } from '@aws-amplify/backend';

export const aiService = defineFunction({
  name: 'ai-service',
  entry: './handler.ts',
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
    OPENROUTER_API_KEY: secret('OPENROUTER_API_KEY'),
  },
  timeoutSeconds: 60,
  memoryMB: 512,
});


