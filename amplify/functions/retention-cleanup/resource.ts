import { defineFunction } from '@aws-amplify/backend';

export const retentionCleanup = defineFunction({
  name: 'retention-cleanup',
  entry: './handler.ts',
  timeoutSeconds: 300,
  memoryMB: 512,
  // This function would be triggered by CloudWatch Events on a schedule
});


