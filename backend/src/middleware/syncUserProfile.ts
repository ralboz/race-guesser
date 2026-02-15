import { Request, Response, NextFunction } from 'express';
import { resolveDisplayName, TokenClaims } from '../utils/resolveDisplayName';
import UserProfile from '../models/UserProfile';

/**
 * Middleware that syncs the user's display name from JWT claims to the database.
 * Runs after jwtCheck. Uses fire-and-forget for the DB upsert so it never blocks the response.
 */
async function syncUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.auth?.payload;
    if (!payload?.sub) {
      next();
      return;
    }

    const claims: TokenClaims = {
      sub: payload.sub,
      name: typeof payload.name === 'string' ? payload.name : undefined,
      nickname: typeof payload.nickname === 'string' ? payload.nickname : undefined,
    };

    const displayName = resolveDisplayName(claims);
    req.displayName = displayName;

    // Fire-and-forget upsert — don't await, don't block the response
    UserProfile.upsert({
      user_id: payload.sub,
      display_name: displayName,
      updated_at: new Date(),
    }).catch((error) => {
      console.error('Failed to upsert UserProfile:', error);
    });
  } catch (error) {
    console.error('Error in syncUserProfile middleware:', error);
  }

  next();
}

export { syncUserProfile };
