import { Routes, Route, Navigate } from "react-router-dom";
import SidebarLayout from "./components/sidebar";
import Sites from "./components/web_sites";
import FeedPage from "./app/feed/page";
import SavedPage from "./app/saved/page";
import RulesPage from "./app/rules/page";
import ReadPage from "./app/read/page";
import Folder1Page from "./app/folders/folder1";
import { Toaster } from "./components/ui/sonner";     
import { BlocklistProvider } from "./context/blocklistContext";
import Landing from "./landingPage";
import { readItems } from "./services/api";
import { useEffect, useState } from "react";

function Home() {
  const userId = 1;

  const [readCount, setReadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchReadCount = async () => {
      try {
        const rssItems = await readItems(userId, "rss");
        const podcastItems = await readItems(userId, "podcast");
        const allItems = [...rssItems, ...podcastItems] as Array<{ read_time: string | null }>;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayCount = allItems.filter((item) => {
          if (!item.read_time) return false;
          const d = new Date(item.read_time);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        }).length;

        if (!cancelled) setReadCount(todayCount);
      } catch (err) {
        console.error("Failed to load read items:", err);
      }
    };

    // Initial fetch + refresh periodically so it updates after new reads
    fetchReadCount();
    const intervalId = window.setInterval(fetchReadCount, 10_000);

    // Refresh on focus/visibility (feels instant when user comes back)
    const onFocus = () => fetchReadCount();
    const onVis = () => {
      if (document.visibilityState === "visible") fetchReadCount();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [userId]);
  
  return (
    <main className="flex-1 p-2 overflow-y-auto">
      

      <section className="mb-3 flex items-center gap-4 w-full">
  <h2 className="text-2xl font-bold mb-1">
    Explore what’s new, just for you.
  </h2>

  {/* Read count (today) */}
  <div className="ml-auto mr-13 flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-sm font-medium">
    <span>Read today:</span>
    <span className="tabular-nums">{readCount}</span>
  </div>
</section>


      <section className="mt-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-l font-bold text-gray-800"></h2>
        </div>

        <p className="text-gray-600">Pick a source to get started — or add one by URL.</p>

        <Sites userId={userId} />
      </section>
    </main>
  );
}

export default function Dashboard() {
  return (
    <>
      <Toaster richColors position="top-center" />
      <BlocklistProvider>
        <Routes>
          <Route path="/landing" element={<Landing />} />

          <Route
            path="/*"
            element={
              <SidebarLayout>
                <Routes>
                  <Route path="home" element={<Home />} />
                  <Route path="feed" element={<FeedPage />} />
                  <Route path="saved" element={<SavedPage />} />
                  <Route path="priority" element={<RulesPage />} />
                  <Route path="recently-read" element={<ReadPage />} />
                  <Route path="folders/:folderId" element={<Folder1Page />} />
                  <Route path="/" element={<Navigate to="/landing" replace />} />
                </Routes>
              </SidebarLayout>
            }
          />
        </Routes>
      </BlocklistProvider>
    </>
  );
}













// import { Routes, Route, Navigate } from "react-router-dom";
// import SidebarLayout from "./components/sidebar"; 
// import Sites from "./components/web_sites";
// import FeedPage from "./app/feed/page";
// import SavedPage from "./app/saved/page";
// import RulesPage from "./app/rules/page";
// import ReadPage from "./app/read/page";
// import Folder1Page from "./app/folders/folder1";
// import { Toaster } from "./components/ui/sonner";
// import { BlocklistProvider } from "./context/blocklistContext";
// import Landing from "./landingPage";
// // import { useAuth } from "./authContext";
// import { readItems } from "./services/api";
// import { useEffect, useState } from "react";

// function Home() {
// // const { dbUser, loading } = useAuth();
// //   // const userId = dbUser?.user_id;
// //   console.log("dbUser = ", dbUser, "loading =", loading);

//   const userId = 8;
//   const [readingStreak, setReadingStreak] = useState(0);
//   // if (loading || !dbUser) {
//   //   return <div>Loading...</div>;
//   // }

// useEffect(() => {
//   const fetchReadItems = async () => {
//     try {
//       // fetch both feed types
//       const rssItems = await readItems(userId, "rss");
//       const podcastItems = await readItems(userId, "podcast");

//       // merge into one array
//       const allItems = [...rssItems, ...podcastItems];

//       const today = new Date().toDateString();

//       const hasReadToday = allItems.some((item) => {
//         const readDate = new Date(item.read_at).toDateString();
//         return readDate === today;
//       });

//       setReadingStreak(hasReadToday ? 1 : 0);
//     } catch (err) {
//       console.error("Failed to load read items:", err);
//     }
//   };

//   fetchReadItems();
// }, [userId]);


//   return (
//     <main className="flex-1 p-2 overflow-y-auto">
//       <section className="mb-3">
//         <h2 className="text-2xl font-bold mb-1">Explore what’s new, just for you.</h2>
//       </section>

//       <section className="mt-2">
//         <div className="flex items-center justify-between mb-2">
//           <h2 className="text-l font-bold text-gray-800">
//           </h2>
//           {/* Reading Streak */}
//           <div className="flex items-center gap-2 mr-13 bg-orange-100 text-orange-700 px-3 py-2 rounded-full text-sm font-medium">
//             🔥 <span>{readingStreak}-day streak</span>
//           </div>
//         </div>
//         <p className="text-gray-600">
//           Choose a source from below or add one by URL
//         </p>
//         <Sites userId={userId} />
//       </section>
//     </main>
//   );
// }




// export default function Dashboard() {
//   return (
//     <>
//       <Toaster richColors position="top-center" />
//       <BlocklistProvider>
//         <Routes>

//           {/* Landing page WITHOUT sidebar */}
//           <Route path="/landing" element={<Landing />} />

//           {/* Dashboard pages WITH sidebar */}
//           <Route
//             path="/*"
//             element={
//               <SidebarLayout>
//                 <Routes>
//                   <Route path="home" element={<Home />} />
//                   <Route path="feed" element={<FeedPage />} />
//                   <Route path="saved" element={<SavedPage />} />
//                   <Route path="priority" element={<RulesPage />} />
//                   <Route path="recently-read" element={<ReadPage />} />
//                   <Route path="folders/:folderId" element={<Folder1Page />} />
//                   <Route path="/" element={<Navigate to="/home" replace />} />
//                 </Routes>
//               </SidebarLayout>
//             }
//           />

//         </Routes>
//       </BlocklistProvider>
//     </>
//   );
// }







