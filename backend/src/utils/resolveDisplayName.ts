export interface TokenClaims {
  sub: string;
  name?: string;
  nickname?: string;
  [key: string]: unknown;
}

/**
 * Resolves a human-readable display name from Auth0 token claims.
 *
 * Priority: name → nickname → sub
 * Non-string values for name/nickname are treated as absent.
 * Values that are empty or whitespace-only after trimming are treated as absent.
 */
export function resolveDisplayName(claims: TokenClaims): string {
  if (typeof claims.name === 'string') {
    const trimmed = claims.name.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  if (typeof claims.nickname === 'string') {
    const trimmed = claims.nickname.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return claims.sub;
}
