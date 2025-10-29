import { Routes, Route, Navigate } from "react-router-dom";
import SidebarLayout from "./components/sidebar"; // <-- use the layout
import Sites from "./components/web_sites";
import FeedPage from "./app/feed/page";
import SavedPage from "./app/saved/page";
import RulesPage from "./app/rules/page";
import ReadPage from "./app/read/page";
import Folder1Page from "./app/folders/folder1";
import { Toaster } from "./components/ui/sonner";

function Home() {
  const userId = 3;
  return (
    <main className="flex-1 p-2 overflow-y-auto">
      <section className="mb-3">
        <h2 className="text-2xl font-bold mb-1">Welcome, User!</h2>
        {/* <p className="text-gray-600 text-xl mb-6">
          Meet your all-in-one feed: your favourite news, articles and blogs delivered your way. <br />
          Save your favourites, add them to folders, keep track of what you've read and stay on top of what matters most.
        </p> */}
        <div className="flex items-center mb-4">
          {/* <FullFeed /> */}
        </div>
      </section>
      <section className="mt-2">
        <h2 className="text-l font-bold text-gray-800 mb-2">
          Stay Updated Your Way
        </h2>
        <p className="text-gray-600">
          Choose a source from below or add one by URL
        </p>
        <Sites userId={userId} />
      </section>
    </main>
  );
}

export default function Dashboard() {
  return (
    <>
      <Toaster richColors position="top-center" />
      <SidebarLayout>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/priority" element={<RulesPage />} />
          <Route path="/recently-read" element={<ReadPage />} />
          <Route path="/folders/:folderId" element={<Folder1Page />} />
          <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
      </SidebarLayout>
    </>
  );
}











// import { Routes, Route, Navigate } from "react-router-dom"
// import Sidebar from "./components/sidebar"
// import Sites from "./components/web_sites"
// import FeedPage from "./app/feed/page"
// import SavedPage from "./app/saved/page"
// import RulesPage from "./app/rules/page"
// // import FullFeed from "./components/sourceList"
// import ReadPage from "./app/read/page"
// import Folder1Page from "./app/folders/folder1"
// import { Toaster } from "./components/ui/sonner"
// // import CreateFolderPage from "./app/createFolder/page"

// //home page
// function Home() {
//   const userId = 3;
//   return (
//     <main className="flex-1 p-10 overflow-y-auto">
//       <section className="mb-3">
//         <h2 className="text-3xl font-bold mb-4">Welcome, User!</h2>
//         <p className="text-gray-600 text-xl mb-6">
//           Meet your all-in-one feed: news, blogs, podcasts, and AI summaries delivered your way. <br />
//           Save, snooze, filter, and stay on top of what matters most.
//         </p>

//         <div className="flex items-center mb-4">
//           {/* <FullFeed /> */}
//         </div>
//       </section>
    
//       <section className="mt-10">
//         <h2 className="text-2xl font-bold text-gray-800 mb-2">
//           Stay Updated, Your Way
//         </h2>
//         <p className="text-gray-600">
//         Choose a source from below or add one by URL—your feed, instantly curated </p>
//         <Sites userId={userId} />
//       </section>
//     </main>
//   )
// }


// //sidebar
// export default function Dashboard() {
//   return (
//     <div className="flex h-screen">
//       <Sidebar />
//       <Toaster richColors position="top-center" /> 

//       <Routes>
//         <Route path="/home" element={<Home />} />
//         <Route path="/feed" element={<FeedPage />} />
//         <Route path="/saved" element={<SavedPage />} />
//         <Route path="/priority" element={<RulesPage />} />
//         <Route path="/recently-read" element={<ReadPage />} />
//         {/* <Route path="/folder1" element={<Folder1Page />} /> */}
//         <Route path="/folders/:folderId" element={<Folder1Page  />} />

//         {/* <Route path="/create-folder" element={<CreateFolderPage />} /> */}

//         <Route path="/" element={<Navigate to="/home" replace />} />
//       </Routes>
//     </div>
//   )
// }

