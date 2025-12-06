import { describe, it, expect, beforeEach } from 'vitest';
import {
  createShareLink,
  validateShareLink,
  revokeShareLink,
  getActiveShareLinks,
} from '../../lib/share';

describe('share utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('createShareLink', () => {
    it('should create a share link with token and passcode', async () => {
      const link = await createShareLink('doc-123');
      
      expect(link).toBeTruthy();
      expect(link?.token).toBeTruthy();
      expect(link?.token.length).toBe(64); // 32 bytes hex = 64 chars
      expect(link?.passcode).toBeTruthy();
      expect(link?.passcode.length).toBe(8); // 4 bytes hex = 8 chars
      expect(link?.documentId).toBe('doc-123');
      expect(link?.expiresAt).toBeTruthy();
    });

    it('should set expiry to 72 hours from now', async () => {
      const before = Date.now();
      const link = await createShareLink('doc-123');
      const after = Date.now();

      const expiryTime = new Date(link!.expiresAt).getTime();
      const expectedMin = before + 72 * 60 * 60 * 1000;
      const expectedMax = after + 72 * 60 * 60 * 1000;

      expect(expiryTime).toBeGreaterThanOrEqual(expectedMin);
      expect(expiryTime).toBeLessThanOrEqual(expectedMax);
    });

    it('should store link in localStorage', async () => {
      await createShareLink('doc-123');
      
      const stored = localStorage.getItem('draftwise_share_links');
      expect(stored).toBeTruthy();
      
      const links = JSON.parse(stored!);
      expect(Object.keys(links).length).toBe(1);
    });
  });

  describe('validateShareLink', () => {
    it('should validate correct token and passcode', async () => {
      const link = await createShareLink('doc-123');
      const result = await validateShareLink(link!.token, link!.passcode);
      
      expect(result.valid).toBe(true);
      expect(result.documentId).toBe('doc-123');
    });

    it('should reject invalid token', async () => {
      await createShareLink('doc-123');
      const result = await validateShareLink('invalid-token', 'ABC123');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Link not found');
    });

    it('should reject invalid passcode', async () => {
      const link = await createShareLink('doc-123');
      const result = await validateShareLink(link!.token, 'WRONG');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid passcode');
    });

    it('should reject expired links', async () => {
      const link = await createShareLink('doc-123');
      
      // Manually expire the link
      const links = JSON.parse(localStorage.getItem('draftwise_share_links')!);
      links[link!.token].expiresAt = new Date(Date.now() - 1000).toISOString();
      localStorage.setItem('draftwise_share_links', JSON.stringify(links));
      
      const result = await validateShareLink(link!.token, link!.passcode);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Link has expired');
    });
  });

  describe('revokeShareLink', () => {
    it('should revoke existing link', async () => {
      const link = await createShareLink('doc-123');
      const revoked = await revokeShareLink(link!.token);
      
      expect(revoked).toBe(true);
      
      const result = await validateShareLink(link!.token, link!.passcode);
      expect(result.valid).toBe(false);
    });

    it('should return false for non-existent link', async () => {
      const revoked = await revokeShareLink('non-existent');
      expect(revoked).toBe(false);
    });
  });

  describe('getActiveShareLinks', () => {
    it('should return active links for document', async () => {
      await createShareLink('doc-123');
      await createShareLink('doc-123');
      await createShareLink('doc-456');
      
      const links = getActiveShareLinks('doc-123');
      expect(links.length).toBe(2);
    });

    it('should not return expired links', async () => {
      const link = await createShareLink('doc-123');
      
      // Expire the link
      const links = JSON.parse(localStorage.getItem('draftwise_share_links')!);
      links[link!.token].expiresAt = new Date(Date.now() - 1000).toISOString();
      localStorage.setItem('draftwise_share_links', JSON.stringify(links));
      
      const activeLinks = getActiveShareLinks('doc-123');
      expect(activeLinks.length).toBe(0);
    });
  });
});


