// auth.ts
import { Request, Response, NextFunction } from "express";

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // FAKE user
  (req as any).user = {
    id: "8", // your hardcoded userId
    email: "demo@example.com",
  };

  next();
};






// import { Request, Response, NextFunction } from "express";
// import { createClient } from "@supabase/supabase-js";

// if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
//   throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY env variables");
// }

// const supabase = createClient(
//   process.env.SUPABASE_URL!,
//   process.env.SUPABASE_ANON_KEY!
// );

// export const authenticateUser = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const authHeader = req.headers.authorization;
//     console.log("auth header:", req.headers.authorization);
//     const token = authHeader?.startsWith("Bearer ")
//       ? authHeader.split(" ")[1]
//       : null;

//     if (!token) {
//       res.status(401).json({ error: "No token provided" });
//       return;
//     }

//     const { data, error } = await supabase.auth.getUser(token);

//     if (error || !data?.user) {
//       res.status(401).json({ error: "Invalid or expired token" });
//       return;
//     }

//     (req as any).user = data.user;

//     // AUTHORIZATION CHECK (must not return a value)
//     if (req.params.userId && req.params.userId !== data.user.id) {
//       res.status(403).json({ error: "Forbidden: user mismatch" });
//       return;
//     }
//     next();
//   } catch (err) {
//     console.error("authenticateUser error:", err);
//     res.status(500).json({ error: "Internal auth error" });
//   }
// };





// // import { createClient } from "@supabase/supabase-js";
// // import { Request, Response, NextFunction } from "express";

// // const supabase = createClient(
// //   process.env.SUPABASE_URL!,
// //   process.env.SUPABASE_SERVICE_ROLE_KEY!
// // );

// // export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
// //   try {
// //     const authHeader = req.headers.authorization;
// //     const token = authHeader?.startsWith("Bearer ")
// //       ? authHeader.split(" ")[1]
// //       : null;
// //     if (!token) {
// //       return res.status(401).json({ error: "No token provided" });
// //     }

// //     const { data, error } = await supabase.auth.getUser(token);

// //     if (error || !data.user) {
// //       return res.status(401).json({ error: "Invalid or expired token" });
// //     }

// //     // IMPORTANT: attach user safely
// //      (req as any).user = data.user;

// //     next();
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ error: "Internal auth error" });
// //   }
// // };
