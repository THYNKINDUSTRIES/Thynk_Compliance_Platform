/**
 * Beta Access Configuration and Utilities
 * 
 * This module handles private beta access control for thynkflow.io
 * 
 * BETA MODE IS CURRENTLY DISABLED - All users can access the platform
 */

import { supabase } from './supabase';

// Beta mode configuration - SET TO FALSE FOR PUBLIC ACCESS
export const BETA_CONFIG = {
  enabled: false, // ← BETA MODE IS OFF - All users can access
  allowedEmailDomains: ['@thynk.guru', '@cultivalaw.com', '@discountpharms.com'],
  officeIpRange: '192.168.1.0/24',
  previewSubdomain: 'beta.thynkflow.io',
  maxInvitesPerUser: 10,
  inviteExpirationDays: 7,
} as const;

/**
 * Check if an email address has beta access (domain-based)
 * When beta is disabled, everyone has access
 */
export function hasBetaAccess(email: string | null | undefined): boolean {
  // If beta is disabled, everyone has access
  if (!BETA_CONFIG.enabled) return true;
  if (!email) return false;
  
  const lowerEmail = email.toLowerCase();
  return BETA_CONFIG.allowedEmailDomains.some(domain => lowerEmail.endsWith(domain));
}

/**
 * Check if beta mode is enabled
 */
export function isBetaMode(): boolean {
  return BETA_CONFIG.enabled;
}

/**
 * Get the allowed email domains for display
 */
export function getAllowedEmailDomain(): string {
  return BETA_CONFIG.allowedEmailDomains.join(', ');
}

/**
 * Format access denied message
 */
export function getAccessDeniedMessage(email?: string): string {
  const domainsText = BETA_CONFIG.allowedEmailDomains.join(', ');
  const base = `This platform is currently in private beta. Access is restricted to users with the following email domains: ${domainsText}, or users with a valid invite code.`;
  
  if (email) {
    return `${base}\n\nYour email (${email}) does not have access. Please contact support@thynk.guru to request beta access.`;
  }
  
  return base;
}

/**
 * Log beta access attempt for monitoring (only in development)
 */
export function logBetaAccessAttempt(
  email: string | null,
  granted: boolean,
  route?: string,
  accessType?: 'domain' | 'invite' | 'none'
): void {
  if (import.meta.env.DEV) {
    console.log('[Beta Access]', {
      email: email ? `${email.substring(0, 3)}***` : 'anonymous',
      granted,
      route,
      accessType,
      timestamp: new Date().toISOString(),
    });
  }
}

// ============================================
// INVITE SYSTEM (Available when beta is re-enabled)
// ============================================

export interface BetaInvite {
  id: string;
  invite_code: string;
  inviter_user_id: string;
  inviter_email: string;
  invited_email: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  created_at: string;
  used_at: string | null;
  expires_at: string;
  accepted_by_user_id: string | null;
  notes: string | null;
}

export interface InviteStats {
  total: number;
  pending: number;
  accepted: number;
  expired: number;
  revoked: number;
}

/**
 * Validate an invite code
 */
export async function validateInviteCode(inviteCode: string): Promise<{
  valid: boolean;
  error?: string;
  inviterEmail?: string;
  invitedEmail?: string;
}> {
  if (!inviteCode) {
    return { valid: false, error: 'Invite code is required' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('beta-invite-system', {
      body: { action: 'validate_invite', inviteCode: inviteCode.toUpperCase() }
    });

    if (error) {
      console.error('Invite validation error:', error);
      return { valid: false, error: 'Failed to validate invite code' };
    }

    if (!data?.valid) {
      return { valid: false, error: data?.error || 'Invalid invite code' };
    }

    return {
      valid: true,
      inviterEmail: data.invite?.inviterEmail,
      invitedEmail: data.invite?.invitedEmail
    };
  } catch (err) {
    console.error('Invite validation error:', err);
    return { valid: false, error: 'Failed to validate invite code' };
  }
}

/**
 * Accept an invite after successful signup
 */
export async function acceptInvite(inviteCode: string, userId: string): Promise<{
  success: boolean;
  error?: string;
  inviterEmail?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('beta-invite-system', {
      body: { action: 'accept_invite', inviteCode: inviteCode.toUpperCase(), userId }
    });

    if (error) {
      console.error('Accept invite error:', error);
      return { success: false, error: 'Failed to accept invite' };
    }

    if (data?.error) {
      return { success: false, error: data.error };
    }

    return { success: true, inviterEmail: data?.inviterEmail };
  } catch (err) {
    console.error('Accept invite error:', err);
    return { success: false, error: 'Failed to accept invite' };
  }
}

/**
 * Create a new invite
 */
export async function createInvite(
  inviterUserId: string,
  inviterEmail: string,
  invitedEmail: string,
  notes?: string
): Promise<{
  success: boolean;
  error?: string;
  inviteCode?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('beta-invite-system', {
      body: {
        action: 'create_invite',
        inviterUserId,
        inviterEmail,
        invitedEmail,
        notes
      }
    });

    if (error) {
      console.error('Create invite error:', error);
      return { success: false, error: 'Failed to create invite' };
    }

    if (data?.error) {
      return { success: false, error: data.error };
    }

    return { success: true, inviteCode: data?.invite?.invite_code };
  } catch (err) {
    console.error('Create invite error:', err);
    return { success: false, error: 'Failed to create invite' };
  }
}

/**
 * Get user's sent invites
 */
export async function getMyInvites(userId: string): Promise<{
  invites: BetaInvite[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('beta-invite-system', {
      body: { action: 'get_my_invites', userId }
    });

    if (error) {
      console.error('Get invites error:', error);
      return { invites: [], error: 'Failed to fetch invites' };
    }

    return { invites: data?.invites || [] };
  } catch (err) {
    console.error('Get invites error:', err);
    return { invites: [], error: 'Failed to fetch invites' };
  }
}

/**
 * Revoke a pending invite
 */
export async function revokeInvite(inviteId: string, userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('beta-invite-system', {
      body: { action: 'revoke_invite', inviteId, userId }
    });

    if (error) {
      console.error('Revoke invite error:', error);
      return { success: false, error: 'Failed to revoke invite' };
    }

    return { success: true };
  } catch (err) {
    console.error('Revoke invite error:', err);
    return { success: false, error: 'Failed to revoke invite' };
  }
}

/**
 * Get invite statistics for a user
 */
export async function getInviteStats(userId: string): Promise<{
  stats: InviteStats;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('beta-invite-system', {
      body: { action: 'get_invite_stats', userId }
    });

    if (error) {
      console.error('Get stats error:', error);
      return { 
        stats: { total: 0, pending: 0, accepted: 0, expired: 0, revoked: 0 },
        error: 'Failed to fetch stats'
      };
    }

    return { stats: data?.stats || { total: 0, pending: 0, accepted: 0, expired: 0, revoked: 0 } };
  } catch (err) {
    console.error('Get stats error:', err);
    return { 
      stats: { total: 0, pending: 0, accepted: 0, expired: 0, revoked: 0 },
      error: 'Failed to fetch stats'
    };
  }
}

/**
 * Generate invite link
 */
export function generateInviteLink(inviteCode: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://thynkflow.io';
  return `${baseUrl}/signup?invite=${inviteCode}`;
}

/**
 * Check if user has beta access via domain OR valid invite code
 */
export async function checkBetaAccessWithInvite(
  email: string | null | undefined,
  inviteCode?: string
): Promise<{
  hasAccess: boolean;
  accessType: 'domain' | 'invite' | 'public' | 'none';
  inviterEmail?: string;
}> {
  // If beta is disabled, everyone has access
  if (!BETA_CONFIG.enabled) {
    return { hasAccess: true, accessType: 'public' };
  }

  // Check domain-based access
  if (hasBetaAccess(email)) {
    return { hasAccess: true, accessType: 'domain' };
  }

  // Check invite code if provided
  if (inviteCode) {
    const validation = await validateInviteCode(inviteCode);
    if (validation.valid) {
      return { 
        hasAccess: true, 
        accessType: 'invite',
        inviterEmail: validation.inviterEmail
      };
    }
  }

  return { hasAccess: false, accessType: 'none' };
}
