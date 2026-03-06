import express, { Request, Response } from 'express';
import { getRacesByYear, getRaceById } from '../data/races';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'alive' });
});

// all race details for particular year
router.get('/races', (req: Request, res: Response) => {
  const year = parseInt(req.query.year as string, 10);
  if (!year || isNaN(year)) {
    return res.status(400).json({ message: 'year query parameter is required' });
  }
  const races = getRacesByYear(year);
  return res.json(races);
});

// single race details
router.get('/races/:raceId', (req: Request, res: Response) => {
  const raceId = req.params.raceId as string;
  const race = getRaceById(raceId);
  if (!race) {
    return res.status(404).json({ message: 'Race not found' });
  }
  return res.json(race);
});

export default router;
