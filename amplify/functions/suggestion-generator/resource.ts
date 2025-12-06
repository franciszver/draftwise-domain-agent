import { defineFunction, secret } from '@aws-amplify/backend';

export const suggestionGenerator = defineFunction({
  name: 'suggestion-generator',
  entry: './handler.ts',
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
    OPENROUTER_API_KEY: secret('OPENROUTER_API_KEY'),
  },
  timeoutSeconds: 120,
  memoryMB: 1024,
});


