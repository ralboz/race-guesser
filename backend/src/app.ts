import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { clerkMiddleware } from './middleware/auth';
import publicRoutes from './routes/public';
import protectedRoutes from './routes/protected';
import adminRoutes from './routes/admin';
import { initializeDatabase } from './models';

const app = express();
const PORT = process.env.PORT || 3001;

initializeDatabase();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Global Clerk middleware — parses auth state on all requests
app.use(clerkMiddleware());

// --Routes--
app.use('/public', publicRoutes);
app.use('/protected', protectedRoutes);
app.use('/admin', adminRoutes)

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  if (
    err.name === 'UnauthorizedError' ||
    err.message?.includes('Unauthenticated') ||
    err.status === 401
  ) {
    return res.status(401).json({ message: 'Invalid token or missing authentication' });
  }

  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
