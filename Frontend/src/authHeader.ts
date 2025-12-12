export async function authHeader() {
  return {};
}









// // authHeader.ts
// import { supabase } from "./lib/supabase";

// export async function authHeader() {
//   const { data, error } = await supabase.auth.getSession();
//   if (error) return {};

//   const session = data.session;
//   if (!session) return {};

//   return {
//     Authorization: `Bearer ${session.access_token}`,
//   };
// }
