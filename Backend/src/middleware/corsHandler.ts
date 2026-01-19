import cors, { CorsOptions, CorsRequest } from "cors";
import { RequestHandler } from "express";

const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];

const corsOptions: CorsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allowOrigin?: boolean | string | RegExp | (boolean | string | RegExp)[]) => void
  ): void => {
    if (!origin) {
      console.log("CORS: request without origin (e.g. curl)");
      return callback(null, true);
    }

    console.log("CORS check:", origin);
    if (allowedOrigins.includes(origin)) {
      // Return the specific origin instead of `true` when credentials are used
      callback(null, origin);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  optionsSuccessStatus: 204,
};

export const corsHandler: RequestHandler = cors(corsOptions);



