export interface ClerkUserClaims {
  userId: string;
  fullName?: string | null;
  primaryEmailAddress?: string | null;
}

// Resolves a human-readable display name from Clerk user claims. Priority: fullName → primaryEmailAddress → userId
export function resolveDisplayName(claims: ClerkUserClaims): string {
  if (typeof claims.fullName === 'string') {
    const trimmed = claims.fullName.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  if (typeof claims.primaryEmailAddress === 'string') {
    const trimmed = claims.primaryEmailAddress.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return claims.userId;
}
