// //fake auth version

// import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// export interface DBUser {
//   user_id: number;
//   email: string;
//   supabase_uid: string;
//   created_at: string;
//   created: boolean;
// }

// interface AuthContextType {
//   supabaseUser: any | null;
//   dbUser: DBUser | null;
//   loading: boolean;
// }

// const AuthContext = createContext<AuthContextType>({
//   supabaseUser: null,
//   dbUser: null,
//   loading: true,
// });

// interface ProviderProps {
//   children: ReactNode;
// }

// export const AuthProvider = ({ children }: ProviderProps) => {
//   const [supabaseUser, setSupabaseUser] = useState<any | null>(null);
//   const [dbUser, setDbUser] = useState<DBUser | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // fake user on load
//     const user = { id: "11", email: "demo@example.com" };
//     setSupabaseUser(user);

//     // fake DB user
//     setDbUser({
//       user_id: 11,
//       email: "demo@example.com",
//       supabase_uid: "11",
//       created_at: new Date().toISOString(),
//       created: false,
//     });

//     setLoading(false);
//   }, []);

//   return (
//     <AuthContext.Provider value={{ supabaseUser, dbUser, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);

// import {
//   createContext,
//   useContext,
//   useEffect,
//   useState,
//   type ReactNode,
// } from "react";
// import { supabase } from "./lib/supabase";
// import { getUserBySupabaseUID } from "./services/api";
// import type { User as SupabaseUser } from "@supabase/supabase-js";

// export interface DBUser {
//   user_id: number;
//   email: string;
//   supabase_uid: string;
//   created_at: string;
//   created: boolean;
// }

// interface AuthContextType {
//   supabaseUser: SupabaseUser | null;
//   dbUser: DBUser | null;
//   loading: boolean;
// }

// const AuthContext = createContext<AuthContextType>({
//   supabaseUser: null,
//   dbUser: null,
//   loading: true,
// });

// interface ProviderProps {
//   children: ReactNode;
// }

// export const AuthProvider = ({ children }: ProviderProps) => {
//   const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
//   const [dbUser, setDbUser] = useState<DBUser | null>(null);
//   const [loading, setLoading] = useState(true);

//   const loadDBUser = async (uid: string): Promise<void> => {
//     try {
//       console.log("Fetching DB user with UID =", uid);

//       const res: DBUser = await getUserBySupabaseUID(uid);
//       console.log("DB user fetched =", res);

//       setDbUser(res ?? null);
//     } catch (err) {
//       console.error("DB user fetch failed:", err);
//       setDbUser(null);
//     }
//   };

//   useEffect(() => {
//     const init = async () => {
//       console.log("AuthProvider useEffect start");
//       const { data } = await supabase.auth.getSession();
//       console.log("Session on load:", data.session);
//       const user = data.session?.user ?? null;

//       setSupabaseUser(user);

//       if (user) {
//         await loadDBUser(user.id);
//       }

//       setLoading(false);
//     };

//     init();

//     const { data: listener } = supabase.auth.onAuthStateChange(
//       async (_event, session) => {
//         const user = session?.user ?? null;
//         setSupabaseUser(user);

//         if (user) {
//           await loadDBUser(user.id);
//         } else {
//           setDbUser(null);
//         }
//       }
//     );

//     return () => listener.subscription.unsubscribe();
//   }, []);

//   return (
//     <AuthContext.Provider value={{ supabaseUser, dbUser, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);

// import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
// import { supabase } from "./lib/supabase";

// interface AuthContextType {
//   supabaseUser: any | null;
//   loading: boolean;
// }

// const AuthContext = createContext<AuthContextType>({
//   supabaseUser: null,
//   loading: true,
// });

// interface ProviderProps {
//   children: ReactNode;
// }

// export const AuthProvider = ({ children }: ProviderProps) => {
//   const [supabaseUser, setSupabaseUser] = useState<any | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Listen to login/logout events
//     const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
//       setSupabaseUser(session?.user ?? null);
//     });

//     // Check session on page load
//     supabase.auth.getSession().then(({ data }) => {
//       setSupabaseUser(data.session?.user ?? null);
//       setLoading(false);
//     });

//     return () => listener.subscription.unsubscribe();
//   }, []);

//   return (
//     <AuthContext.Provider value={{ supabaseUser, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);

// import { createContext, useContext, useEffect, useState } from "react";
// import { supabase } from "./lib/supabase";
// import { addUser } from "./services/api";

// interface AuthContextType {
//   supabaseUser: any;
//   dbUser: any;
//   loading: boolean;
// }

// const AuthContext = createContext<AuthContextType>({
//   supabaseUser: null,
//   dbUser: null,
//   loading: true,
// });

// export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
//   const [supabaseUser, setSupabaseUser] = useState<any>(null);
//   const [dbUser, setDbUser] = useState<any>(null);
//   const [loading, setLoading] = useState(true);

//   // Listen login + logout
//   useEffect(() => {
//     const { data: listener } = supabase.auth.onAuthStateChange(
//       async (_event, session) => {
//         const user = session?.user ?? null;
//         setSupabaseUser(user);

//         if (user) {
//           const dbRes = await addUser(user.id);
//           setDbUser(dbRes?.user ?? null);
//         } else {
//           setDbUser(null);
//         }
//       }
//     );

//     // On page refresh, fetch session
//     supabase.auth.getSession().then(async ({ data }) => {
//       const user = data.session?.user ?? null;
//       setSupabaseUser(user);

//       if (user) {
//         const dbRes = await addUser(user.id);
//         setDbUser(dbRes?.user ?? null);
//       }
//       setLoading(false);
//     });

//     return () => listener.subscription.unsubscribe();
//   }, []);

//   return (
//     <AuthContext.Provider value={{ supabaseUser, dbUser, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);

// import { createContext, useContext, useState, type ReactNode } from "react";

// interface AuthUser {
//   userId: number | null;
//   email: string | null;
// }

// interface AuthContextType {
//   authUser: AuthUser;
//   setAuthUser: React.Dispatch<React.SetStateAction<AuthUser>>;
// }

// const AuthContext = createContext<AuthContextType | null>(null);

// interface ProviderProps {
//   children: ReactNode;
// }

// export const AuthProvider = ({ children }: ProviderProps) => {
//   const [authUser, setAuthUser] = useState<AuthUser>({
//     userId: null,
//     email: null,
//   });

//   return (
//     <AuthContext.Provider value={{ authUser, setAuthUser }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext)!;
