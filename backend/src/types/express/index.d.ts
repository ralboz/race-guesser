/// <reference types="@clerk/express/env" />

declare global {
  namespace Express {
    interface Request {
      displayName?: string;
    }
  }
}

export {};
