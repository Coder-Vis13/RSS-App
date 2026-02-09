import { UserJwtPayload } from "../auth/types";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
      };
    }
  }
}

declare module "express-serve-static-core" {
  interface Request {
    cookies: {
      refresh?: string;
    };
  }
}
