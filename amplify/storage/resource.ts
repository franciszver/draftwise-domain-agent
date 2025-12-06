import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'draftwise-storage',
  access: (allow) => ({
    // Evidence attachments - users can upload/download
    'evidence/{document_id}/*': [
      allow.guest.to(['read', 'write', 'delete']),
    ],
    // Document exports
    'exports/{document_id}/*': [
      allow.guest.to(['read', 'write']),
    ],
    // Regulatory source cache
    'sources/{domain_id}/*': [
      allow.guest.to(['read', 'write']),
    ],
  }),
});


