declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
      };
      demoMode?: boolean;
    }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    cookies: {
      refresh?: string;
      demo_session?: string;
    };
  }
}

export {};
