import express, { Request, Response } from 'express';
import { jwtCheck } from '../middleware/auth';

const router = express.Router();

router.use(jwtCheck);

router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'This is a protected endpoint',
    user: req.auth
  });
});

router.get('/user', (req: Request, res: Response) => {
  const userId = req.auth?.payload.sub;

  return res.status(404).json({});
  // res.json({
  //   message: 'User data retrieved',
  //   userId: userId,
  //   groupCode: 342313,
  //   groupName: 'The f1 predictorzz'
  // });
});

export default router;