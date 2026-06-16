declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
      };
    }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    cookies: {
      refresh?: string;
    };
  }
}

export {};