// Share link utilities

export interface ShareLink {
  token: string;
  passcode: string;
  documentId: string;
  expiresAt: string;
}

export async function createShareLink(documentId: string): Promise<ShareLink | null> {
  try {
    // In production, this would call the Lambda function via API
    // For local dev, we simulate the response
    const token = generateToken();
    const passcode = generatePasscode();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    const link: ShareLink = {
      token,
      passcode,
      documentId,
      expiresAt,
    };

    // Store in localStorage for local dev
    const links = getStoredLinks();
    links[token] = link;
    localStorage.setItem('draftwise_share_links', JSON.stringify(links));

    return link;
  } catch (error) {
    console.error('Failed to create share link:', error);
    return null;
  }
}

export async function validateShareLink(
  token: string,
  passcode: string
): Promise<{ valid: boolean; documentId?: string; error?: string }> {
  try {
    const links = getStoredLinks();
    const link = links[token];

    if (!link) {
      return { valid: false, error: 'Link not found' };
    }

    if (new Date(link.expiresAt) < new Date()) {
      delete links[token];
      localStorage.setItem('draftwise_share_links', JSON.stringify(links));
      return { valid: false, error: 'Link has expired' };
    }

    if (link.passcode !== passcode) {
      return { valid: false, error: 'Invalid passcode' };
    }

    return { valid: true, documentId: link.documentId };
  } catch (error) {
    console.error('Failed to validate share link:', error);
    return { valid: false, error: 'Validation failed' };
  }
}

export async function revokeShareLink(token: string): Promise<boolean> {
  try {
    const links = getStoredLinks();
    if (links[token]) {
      delete links[token];
      localStorage.setItem('draftwise_share_links', JSON.stringify(links));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to revoke share link:', error);
    return false;
  }
}

export function getShareLinkUrl(token: string): string {
  return `${window.location.origin}/shared/${token}`;
}

export function getActiveShareLinks(documentId: string): ShareLink[] {
  const links = getStoredLinks();
  const now = new Date();
  return Object.values(links).filter(
    (link) => link.documentId === documentId && new Date(link.expiresAt) > now
  );
}

// Helper functions
function getStoredLinks(): Record<string, ShareLink> {
  try {
    const stored = localStorage.getItem('draftwise_share_links');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function generatePasscode(): string {
  const array = new Uint8Array(4);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}


