import { Routes, Route, Navigate } from "react-router-dom";
import SidebarLayout from "./components/sidebar/SidebarLayout";
import FeedPage from "./app/feed/page";
import SavedPage from "./app/saved/page";
import RulesPage from "./app/rules/page";
import ReadPage from "./app/read/page";
import FolderPage from "./app/folders/folder";
import { Toaster } from "./components/ui/sonner";
import { BlocklistProvider } from "./context/blocklistContext";
import Landing from "./LandingPage";
import SourcePage from "./app/source/page";

function Discover() {

  return (
    <main className="flex-1 p-2 overflow-y-auto">
      <section className="mb-3 flex items-center gap-4 w-full">
        <h2 className="text-2xl font-bold mb-1">
          Explore what’s new, just for you.
        </h2>
      </section>

      <section className="mt-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-l font-bold text-gray-800"></h2>
        </div>

        <p className="text-gray-600">
          Pick a source to get started — or add one by URL.
        </p>

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
                  <Route path="discover" element={<Discover />} />
                  <Route path="feed" element={<FeedPage />} />
                  <Route path="saved" element={<SavedPage />} />
                  <Route path="priority" element={<RulesPage />} />
                  <Route path="recently-read" element={<ReadPage />} />
                  <Route path="folders/:folderId" element={<FolderPage />} />
                  <Route path="/sources/:sourceId" element={<SourcePage />} />
                  <Route
                    path="/"
                    element={<Navigate to="/landing" replace />}
                  />
                </Routes>
              </SidebarLayout>
            }
          />
        </Routes>
      </BlocklistProvider>
    </>
  );
}
