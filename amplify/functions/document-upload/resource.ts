import { defineFunction } from '@aws-amplify/backend';

export const documentUpload = defineFunction({
  name: 'document-upload',
  entry: './handler.ts',
  timeoutSeconds: 60,
  memoryMB: 1024,
});
