import { Routes, Route, Navigate } from "react-router-dom"
import Sidebar from "./components/sidebar"
import Sites from "./components/web_sites"
import FeedPage from "./app/feed/page"
import SavedPage from "./app/saved/page"
import RulesPage from "./app/rules/page"
import FullFeed from "./components/sourceList"

//home page
function Home() {
  return (
    <main className="flex-1 p-10 overflow-y-auto">
      <section className="mb-3">
        <h2 className="text-3xl font-bold mb-4">Welcome, User!</h2>
        <p className="text-gray-600 text-xl mb-6">
          Meet your all-in-one feed: news, blogs, podcasts, and AI summaries delivered your way. <br />
          Save, snooze, filter, and stay on top of what matters most.
        </p>

        <div className="flex items-center mb-4">
          <FullFeed />
        </div>
      </section>
    
      <section className="mt-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Stay Updated, Your Way
        </h2>
        <p className="text-gray-600">
        Choose a source from below or add one by URL—your feed, instantly curated </p>
        <Sites />
      </section>
    </main>
  )
}


//sidebar
export default function Dashboard() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/" element={<Navigate to="/home" replace />} />
      </Routes>
    </div>
  )
}

