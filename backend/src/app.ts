import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import publicRoutes from './routes/public';
import protectedRoutes from './routes/protected';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// --Routes--
app.use('/public', publicRoutes);
app.use('/protected', protectedRoutes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);

  // Handle auth errors
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Invalid token or missing authentication' });
  }

  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
