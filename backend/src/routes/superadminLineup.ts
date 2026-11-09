import express, { Request, Response } from 'express';
import { requireAuth, getAuth } from '../middleware/auth';
import {
  LineupError,
  applyLineupChange,
  listLineupChanges,
  previewLineupChange,
  revertLineupChange,
} from '../services/lineupService';

/**
 * Admin-only driver lineup management (stand-ins and mid-season swaps).
 * Mounted at /superadmin/lineup. Admins are the Clerk user ids in ADMIN_IDS.
 */
const router = express.Router();

router.use(requireAuth());

router.use((req: Request, res: Response, next) => {
  const { userId } = getAuth(req);
  const adminIds = (process.env.ADMIN_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!userId || !adminIds.includes(userId)) return res.sendStatus(403);
  (req as Request & { adminId: string }).adminId = userId;
  return next();
});

function handleError(res: Response, err: unknown, context: string) {
  if (err instanceof LineupError) {
    return res.status(400).json({ error: err.message });
  }
  console.error(`[lineup] ${context} failed:`, err);
  return res.status(500).json({ error: 'Unexpected error, nothing was changed' });
}

// All recorded changes, newest first (including reverted ones, for the audit trail)
router.get('/changes', async (_req: Request, res: Response) => {
  try {
    return res.json(await listLineupChanges());
  } catch (err) {
    return handleError(res, err, 'list');
  }
});

// Dry run: validates the change and reports how many stored rows it would rename
router.post('/preview', async (req: Request, res: Response) => {
  try {
    return res.json(await previewLineupChange(req.body));
  } catch (err) {
    return handleError(res, err, 'preview');
  }
});

// Apply a change: records it and renames the driver in predictions/results/scores atomically
router.post('/changes', async (req: Request, res: Response) => {
  try {
    const adminId = (req as Request & { adminId: string }).adminId;
    return res.status(201).json(await applyLineupChange(req.body, adminId));
  } catch (err) {
    return handleError(res, err, 'apply');
  }
});

// Undo the most recent active change
router.post('/changes/:id/revert', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid change id' });
    const adminId = (req as Request & { adminId: string }).adminId;
    return res.json(await revertLineupChange(id, adminId));
  } catch (err) {
    return handleError(res, err, 'revert');
  }
});

export default router;
