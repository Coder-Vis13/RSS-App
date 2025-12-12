// import express from "express";
// import { createClient } from "@supabase/supabase-js";
// import { supabaseAdmin } from "../supabase";

// const router = express.Router();

// const supabase = createClient(
//   process.env.SUPABASE_URL!,
//   process.env.SUPABASE_ANON_KEY!
// );

// // -------------------------------
// // ADD USER TO INTERNAL DB
// // -------------------------------
// async function addUserToDB({
//   email,
//   supabase_uid,
// }: {
//   email: string;
//   supabase_uid: string;
// }) {
//   const { data, error } = await supabaseAdmin
//     .from("users")
//     .insert({
//       email,
//       supabase_uid,
//     })
//     .select()
//     .single();

//   if (error) {
//     console.error("DB insert error:", error);
//     throw error;
//   }

//   return data;
// }

// // -------------------------------
// // SIGNUP
// // -------------------------------
// router.post("/auth/signup", async (req, res) => {
//   const { email, password } = req.body;

//   const { data, error } = await supabase.auth.signUp({
//     email,
//     password,
//   });

//   if (error) return res.status(400).json({ error });

//   if (!data.user) {
//     return res.status(500).json({ error: "Signup failed" });
//   }

//   // INSERT INTO INTERNAL DB (your `users` table)
//   try {
//     await addUserToDB({
//       email,
//       supabase_uid: data.user.id,
//     });
//   } catch (dbErr) {
//     return res.status(500).json({ error: "Could not insert user into DB" });
//   }

//   res.json({ user: data.user });
// });

// // -------------------------------
// // LOGIN
// // -------------------------------
// router.post("/auth/login", async (req, res) => {
//   const { email, password } = req.body;

//   const { data, error } = await supabase.auth.signInWithPassword({
//     email,
//     password,
//   });

//   if (error) return res.status(400).json({ error });

//   res.json(data); // access token + user
// });

// export default router;




// // import express from "express";
// // import { createClient } from "@supabase/supabase-js";
// // import { supabaseAdmin } from "../supabase";

// // const router = express.Router();

// // const supabase = createClient(
// //   process.env.SUPABASE_URL!,
// //   process.env.SUPABASE_ANON_KEY!
// // );

// // // SIGNUP
// // router.post("/auth/signup", async (req, res) => {
// //   const { email, password } = req.body;

// //   const { data, error } = await supabase.auth.signUp({
// //     email,
// //     password,
// //   });

// //   if (error) return res.status(400).json({ error });
// //   if (!data.user) {
// //     return res.status(500).json({ error: "Signup failed" });
// //   }

// //   // ADD USER TO YOUR OWN DB
// // async function addUserToDB({ email, supabase_uid }: { email: string; supabase_uid: string }) {
// //   const { data, error } = await supabaseAdmin
// //     .from("users")
// //     .insert({
// //       email,
// //       supabase_uid
// //     })
// //     .select()
// //     .single();

// //   if (error) {
// //     console.error("DB insert error:", error);
// //     throw error;
// //   }

// //   return data;
// // }
// //   res.json({ user: data.user });
// // });

// // // LOGIN
// // router.post("/auth/login", async (req, res) => {
// //   const { email, password } = req.body;

// //   const { data, error } = await supabase.auth.signInWithPassword({
// //     email,
// //     password,
// //   });

// //   if (error) return res.status(400).json({ error });

// //   res.json(data); // contains access token
// // });

// // export default router;
// // function addUserToDB(arg0: { email: any; supabase_uid: string; }) {
// //     throw new Error("Function not implemented.");
// // }

