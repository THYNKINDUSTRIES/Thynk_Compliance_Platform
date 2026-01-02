import React from 'react';
import { isBetaMode } from '@/lib/betaAccess';

interface PreviewAuthGuardProps {
  children: React.ReactNode;
}

/**
 * PreviewAuthGuard - Simplified version
 * 
 * When beta mode is OFF (current state), this just passes through all children.
 * When beta mode is ON, it would enforce authentication for preview environments.
 */
export const PreviewAuthGuard: React.FC<PreviewAuthGuardProps> = ({ children }) => {
  // Beta mode is currently OFF - just render children
  if (!isBetaMode()) {
    return <>{children}</>;
  }

  // If beta mode is ever re-enabled, this would enforce auth
  // For now, just pass through
  return <>{children}</>;
};

export default PreviewAuthGuard;
