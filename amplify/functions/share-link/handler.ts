import type { Handler } from 'aws-lambda';
import { randomBytes } from 'crypto';

interface CreateLinkRequest {
  action: 'create';
  documentId: string;
}

interface ValidateLinkRequest {
  action: 'validate';
  token: string;
  passcode: string;
}

interface RevokeLinkRequest {
  action: 'revoke';
  token: string;
}

type ShareLinkRequest = CreateLinkRequest | ValidateLinkRequest | RevokeLinkRequest;

interface ShareLinkResponse {
  success: boolean;
  token?: string;
  passcode?: string;
  expiresAt?: string;
  documentId?: string;
  error?: string;
}

// Generate a secure random token
function generateToken(): string {
  return randomBytes(32).toString('hex');
}

// Generate a simple passcode
function generatePasscode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

// Calculate expiry (72 hours from now)
function calculateExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 72);
  return expiry;
}

// In-memory store for development (use DynamoDB in production)
const linkStore = new Map<string, {
  documentId: string;
  passcode: string;
  expiresAt: Date;
  accessCount: number;
}>();

async function createShareLink(documentId: string): Promise<ShareLinkResponse> {
  const token = generateToken();
  const passcode = generatePasscode();
  const expiresAt = calculateExpiry();

  // Store the link (in production, save to DynamoDB)
  linkStore.set(token, {
    documentId,
    passcode,
    expiresAt,
    accessCount: 0,
  });

  return {
    success: true,
    token,
    passcode,
    expiresAt: expiresAt.toISOString(),
  };
}

async function validateShareLink(token: string, passcode: string): Promise<ShareLinkResponse> {
  const link = linkStore.get(token);

  if (!link) {
    return { success: false, error: 'Link not found' };
  }

  if (new Date() > link.expiresAt) {
    linkStore.delete(token);
    return { success: false, error: 'Link has expired' };
  }

  if (link.passcode !== passcode) {
    return { success: false, error: 'Invalid passcode' };
  }

  // Update access count
  link.accessCount++;

  return {
    success: true,
    documentId: link.documentId,
    expiresAt: link.expiresAt.toISOString(),
  };
}

async function revokeShareLink(token: string): Promise<ShareLinkResponse> {
  if (linkStore.has(token)) {
    linkStore.delete(token);
    return { success: true };
  }
  return { success: false, error: 'Link not found' };
}

export const handler: Handler = async (event) => {
  const request = (event.arguments || event) as ShareLinkRequest;

  try {
    switch (request.action) {
      case 'create':
        return await createShareLink(request.documentId);

      case 'validate':
        return await validateShareLink(request.token, request.passcode);

      case 'revoke':
        return await revokeShareLink(request.token);

      default:
        return { success: false, error: 'Invalid action' };
    }
  } catch (error) {
    console.error('Share link error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};


