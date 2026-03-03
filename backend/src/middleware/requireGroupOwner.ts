import { Request, Response, NextFunction } from 'express';
import { getAuth } from './auth';
import { Group } from '../models';

// ensures authenticated user is group owner
export async function requireGroupOwner(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getAuth(req).userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const group = await Group.findOne({ where: { owner_id: userId } });
    if (!group) {
      return res.status(403).json({ message: 'Only the group owner can perform this action' });
    }

    // Attach to request so downstream handlers can use it
    (req as any).group = group;
    next();
  } catch (error) {
    console.error('requireGroupOwner error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
