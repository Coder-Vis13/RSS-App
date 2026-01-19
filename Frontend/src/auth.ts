// // fake auth version
// export async function signUp(email: string, _password: string) {
//   return { data: { user: { id: "8", email } }, error: null };
// }

// export async function signIn(email: string, _password: string) {
//   return { data: { user: { id: "8", email } }, error: null };
// }

// export async function signOut() {
//   return { error: null };
// }

// export async function getCurrentUser() {
//   return { data: { user: { id: "8", email: "demo@example.com" } }, error: null };
// }







//previous code


// import { supabase } from "./lib/supabase";

// export async function signUp(email: string, password: string) {
//   const { data, error } = await supabase.auth.signUp({ email, password });
//   return { data, error };
// }

// export async function signIn(email: string, password: string) {
//   const { data, error } = await supabase.auth.signInWithPassword({
//     email,
//     password,
//   });
//   return { data, error };
// }

// export async function signOut() {
//   const { error } = await supabase.auth.signOut();
//   return { error };  
// }


// export async function getCurrentUser() {
//   const { data, error } = await supabase.auth.getUser();
//   return { data, error };
// }
