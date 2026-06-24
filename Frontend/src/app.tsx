import { Routes, Route, Navigate } from "react-router-dom";
import SidebarLayout from "./components/sidebar/SidebarLayout";
import FeedPage from "./pages/FeedPage";
import SavedPage from "./pages/SavedPage";
import ReadPage from "./pages/ReadPage";
import FolderPage from "./pages/FolderPage";
import { Toaster } from "./components/ui/sonner";
import Landing from "./LandingPage";
import SourcePage from "./pages/SourcePage";
import { getAuthUserId } from "./auth";

function RequireAuth({ children }: { children: React.ReactNode }) {
  return getAuthUserId() ? <>{children}</> : <Navigate to="/landing" replace />;
}

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
      <Routes>
        <Route path="/landing" element={<Landing />} />

        <Route
          path="/*"
          element={
            <RequireAuth>
              <SidebarLayout>
                <Routes>
                  <Route path="discover" element={<Discover />} />
                  <Route path="feed" element={<FeedPage />} />
                  <Route path="saved" element={<SavedPage />} />
                  <Route path="recently-read" element={<ReadPage />} />
                  <Route path="folders/:folderId" element={<FolderPage />} />
                  <Route path="/sources/:sourceId" element={<SourcePage />} />
                  <Route path="/" element={<Navigate to="/feed" replace />} />
                </Routes>
              </SidebarLayout>
            </RequireAuth>
          }
        />
      </Routes>
    </>
  );
}
