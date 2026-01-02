import React from 'react';
import { isBetaMode } from '@/lib/betaAccess';

interface BetaAccessGuardProps {
  children: React.ReactNode;
}

/**
 * BetaAccessGuard - Simplified version
 * 
 * When beta mode is OFF (current state), this just passes through all children.
 * When beta mode is ON, it would check for beta access.
 */
export const BetaAccessGuard: React.FC<BetaAccessGuardProps> = ({ children }) => {
  // Beta mode is currently OFF - just render children
  if (!isBetaMode()) {
    return <>{children}</>;
  }

  // If beta mode is ever re-enabled, this would check access
  // For now, just pass through
  return <>{children}</>;
};

export default BetaAccessGuard;
