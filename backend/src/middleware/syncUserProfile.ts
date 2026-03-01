import { Request, Response, NextFunction } from 'express';
import { clerkClient, getAuth } from '@clerk/express';
import { resolveDisplayName, ClerkUserClaims } from '../utils/resolveDisplayName';
import UserProfile from '../models/UserProfile';

const SYNC_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

const syncCache = new Map<string, { displayName: string; syncedAt: number }>();

// Middleware that syncs the user's display name from Clerk to the database.
// Uses an in-memory cache to avoid any I/O when the profile was synced recently.
async function syncUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = getAuth(req);
    const userId = auth.userId;
    if (!userId) {
      next();
      return;
    }

    const cached = syncCache.get(userId);
    if (cached && (Date.now() - cached.syncedAt) < SYNC_INTERVAL_MS) {
      req.displayName = cached.displayName;
      next();
      return;
    }

    let claims: ClerkUserClaims = { userId };

    try {
      const user = await clerkClient.users.getUser(userId);
      claims = {
        userId,
        fullName: user.fullName,
        primaryEmailAddress: user.primaryEmailAddress?.emailAddress ?? null,
      };
    } catch (error) {
      console.error('Failed to fetch Clerk user details:', error);
    }

    const displayName = resolveDisplayName(claims);
    req.displayName = displayName;

    syncCache.set(userId, { displayName, syncedAt: Date.now() });

    UserProfile.upsert({
      user_id: userId,
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
