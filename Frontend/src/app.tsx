import { Routes, Route, Navigate } from "react-router-dom";
import SidebarLayout from "./components/sidebar";
import Sites from "./components/web_sites";
import FeedPage from "./app/feed/page";
import SavedPage from "./app/saved/page";
import RulesPage from "./app/rules/page";
import ReadPage from "./app/read/page";
import Folder1Page from "./app/folders/folder1";
import { Toaster } from "./components/ui/sonner";     // your shadcn Toaster wrapper
import { toast } from "sonner";                       // correct toast import
import { BlocklistProvider } from "./context/blocklistContext";
import Landing from "./landingPage";
import { readItems } from "./services/api";
import { useEffect, useState } from "react";

// --- Inline Goal Modal ---
function GoalModal({ isOpen, onClose, onSave, defaultValue }: any) {
  if (!isOpen) return null;

  const [value, setValue] = useState(defaultValue || 1);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200]">
      <div className="bg-white rounded-xl p-6 shadow-lg w-80">
        <h2 className="text-lg font-semibold mb-3">Set Reading Goal</h2>

        <input
          type="number"
          min={1}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="border p-2 rounded w-full mb-4"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-600">
            Cancel
          </button>

          <button
            onClick={() => onSave(value)}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const userId = 25;

  const [readingStreak, setReadingStreak] = useState(0);
  const [goal, setGoal] = useState<number>(() => {
    return Number(localStorage.getItem("readingGoal") || 1);
  });
  const [isGoalModalOpen, setGoalModalOpen] = useState(false);

  // --- Consecutive streak logic ---
 const calculateStreak = (items: { read_time: string | null }[], goal: number) => {
  if (items.length === 0) return 0;

  // Map: date string -> count of read articles that day
  const counts: Record<string, number> = {};

  items.forEach((item) => {
    if (!item.read_time) return;
    const d = new Date(item.read_time);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString();
    counts[key] = (counts[key] || 0) + 1;
  });

  // Sort dates descending
  const sortedDates = Object.keys(counts)
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);

  for (let date of sortedDates) {
    const key = date.toISOString();
    if (counts[key] >= goal && date.getTime() === current.getTime()) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else if (date.getTime() < current.getTime()) {
      break; // streak broken
    }
  }

  return streak;
};


  const [goalReached, setGoalReached] = useState(false);

useEffect(() => {
  const fetchReadItems = async () => {
    try {
      const rssItems = await readItems(userId, "rss");
      const podcastItems = await readItems(userId, "podcast");
      const allItems = [...rssItems, ...podcastItems];

      const streak = calculateStreak(allItems, goal);
      setReadingStreak(streak);

      // Check if today’s goal is reached
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayCount = allItems.filter((item) => {
        if (!item.read_time) return false;
        const d = new Date(item.read_time);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      }).length;

      if (todayCount >= goal && !goalReached) {
        toast.success("🎉 You reached your reading goal today!");
        setGoalReached(true);
      } else if (todayCount < goal && goalReached) {
        // reset if user hasn’t met goal yet
        setGoalReached(false);
      }
    } catch (err) {
      console.error("Failed to load read items:", err);
    }
  };

  fetchReadItems();
}, [userId, goal, goalReached]);

  // Save reading goal
  const handleSaveGoal = (value: number) => {
    setGoal(value);
    localStorage.setItem("readingGoal", value.toString());
    toast.success("Reading goal saved!");   // works properly now
    setGoalModalOpen(false);
  };

  return (
    <main className="flex-1 p-2 overflow-y-auto">
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        onSave={handleSaveGoal}
        defaultValue={goal}
      />

      <section className="mb-3">
        <h2 className="text-2xl font-bold mb-1">
          Explore what’s new, just for you.
        </h2>
      </section>

      <section className="mt-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-l font-bold text-gray-800"></h2>

          <div className="flex items-center gap-3 mr-13">

            {/* Reading Goal */}
            <button
              onClick={() => setGoalModalOpen(true)}
              className="bg-blue-100 text-blue-700 px-3 py-2 rounded-full text-sm font-medium hover:bg-blue-200 transition"
            >
              🎯 Goal: {goal}/day
            </button>

            {/* Streak */}
            <div className="flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-2 rounded-full text-sm font-medium">
              🔥 <span>{readingStreak}-day streak</span>
            </div>

          </div>
        </div>

        <p className="text-gray-600">Choose a source from below or add one by URL</p>

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







