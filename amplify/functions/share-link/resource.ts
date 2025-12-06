import { defineFunction } from '@aws-amplify/backend';

export const shareLink = defineFunction({
  name: 'share-link',
  entry: './handler.ts',
  timeoutSeconds: 30,
  memoryMB: 256,
});


