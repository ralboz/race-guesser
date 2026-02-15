export interface TokenClaims {
  sub: string;
  name?: string;
  nickname?: string;
  [key: string]: unknown;
}

//Resolves a human-readable display name from Auth0 token claims. Priority: name -> nickname -> sub
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
