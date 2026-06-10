// // src/context/AppStateContext.tsx

// import { createContext, useContext, useState, useEffect } from "react";
// import { readItems } from "@/services/user.service";

// type TimeFilter = "all" | "today" | "week" | "month";
// type FeedType = "rss" | "podcast";

// interface AppState {
//   feedType: FeedType;
//   setFeedType: (t: FeedType) => void;

//   selectedCategory: string;
//   setSelectedCategory: (c: string) => void;

//   selectedTime: TimeFilter;
//   setSelectedTime: (t: TimeFilter) => void;

//   readCount: number;

//   blocklist: string[];
//   addBlockedWord: (word: string) => void;
//   removeBlockedWord: (word: string) => void;
// }

// const AppStateContext = createContext<AppState | null>(null);

// export function AppStateProvider({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const userId = 1;

//   const [feedType, setFeedType] = useState<FeedType>("rss");
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const [selectedTime, setSelectedTime] = useState<TimeFilter>("all");
//   const [readCount, setReadCount] = useState(0);

//   const [blocklist, setBlocklist] = useState<string[]>(() => {
//     const stored = localStorage.getItem("blocklist");
//     return stored ? JSON.parse(stored) : [];
//   });

//   // Persist blocklist
//   useEffect(() => {
//     localStorage.setItem("blocklist", JSON.stringify(blocklist));
//   }, [blocklist]);

//   // Poll read count globally
//   useEffect(() => {
//     const fetchReadCount = async () => {
//       const items = await readItems(userId);

//       const today = new Date();
//       today.setHours(0, 0, 0, 0);

//       const todayCount = items.filter((item: any) => {
//         if (!item.read_time) return false;
//         const d = new Date(item.read_time);
//         d.setHours(0, 0, 0, 0);
//         return d.getTime() === today.getTime();
//       }).length;

//       setReadCount(todayCount);
//     };

//     fetchReadCount();
//     const interval = setInterval(fetchReadCount, 10000);
//     return () => clearInterval(interval);
//   }, [userId]);

//   const addBlockedWord = (word: string) => {
//     const clean = word.trim().toLowerCase();
//     if (!clean) return;
//     if (blocklist.includes(clean)) return;
//     setBlocklist((prev) => [...prev, clean]);
//   };

//   const removeBlockedWord = (word: string) => {
//     setBlocklist((prev) => prev.filter((w) => w !== word));
//   };

//   return (
//     <AppStateContext.Provider
//       value={{
//         feedType,
//         setFeedType,
//         selectedCategory,
//         setSelectedCategory,
//         selectedTime,
//         setSelectedTime,
//         readCount,
//         blocklist,
//         addBlockedWord,
//         removeBlockedWord,
//       }}
//     >
//       {children}
//     </AppStateContext.Provider>
//   );
// }

// export function useAppState() {
//   const context = useContext(AppStateContext);
//   if (!context) {
//     throw new Error("useAppState must be used inside AppStateProvider");
//   }
//   return context;
// }
