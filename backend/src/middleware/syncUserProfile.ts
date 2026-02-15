import { Request, Response, NextFunction } from 'express';
import { resolveDisplayName, TokenClaims } from '../utils/resolveDisplayName';
import UserProfile from '../models/UserProfile';

// Middleware that syncs the user's display name from JWT claims to the database.
async function syncUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.auth?.payload;
    if (!payload?.sub) {
      next();
      return;
    }

    const namespace = 'https://f1-predictor.com/';
    const nameValue = payload[`${namespace}name`];
    const nicknameValue = payload[`${namespace}nickname`];

    const claims: TokenClaims = {
      sub: payload.sub,
      name: typeof nameValue === 'string' ? nameValue : undefined,
      nickname: typeof nicknameValue === 'string' ? nicknameValue : undefined,
    };

    const displayName = resolveDisplayName(claims);
    req.displayName = displayName;

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
