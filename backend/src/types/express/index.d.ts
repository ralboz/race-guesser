import { JwtPayload } from 'express-oauth2-jwt-bearer';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        payload: JwtPayload & {
          sub: string;
          name?: string;
          nickname?: string;
        };
      };
      displayName?: string;
    }
  }
}

export {};