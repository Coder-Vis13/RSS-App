import { Routes, Route, Navigate } from "react-router-dom";
import SidebarLayout from "./components/sidebar/SidebarLayout";
import FeedPage from "./pages/FeedPage";
import SavedPage from "./pages/SavedPage";
import ReadPage from "./pages/ReadPage";
import FolderPage from "./pages/FolderPage";
import { Toaster } from "./components/ui/sonner";
import Landing from "./pages/landingPage";
import SourcePage from "./pages/SourcePage";
import { Analytics } from "@vercel/analytics/react";
import {
  clearDemoSessionState,
  clearAccessToken,
  getAuthUserId,
  isDemoMode,
  validateDemoSession,
} from "./auth";
import { useEffect, useState } from "react";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const demoMode = isDemoMode();
  const [demoStatus, setDemoStatus] = useState<"ready" | "checking" | "invalid">(
    demoMode ? "checking" : "ready",
  );

  useEffect(() => {
    if (!demoMode) {
      setDemoStatus("ready");
      return;
    }

    validateDemoSession()
      .then(() => setDemoStatus("ready"))
      .catch(() => {
        clearDemoSessionState();
        clearAccessToken();
        setDemoStatus("invalid");
      });
  }, [demoMode]);

  if (demoMode && demoStatus === "checking") {
    return <main className="p-6">Loading demo...</main>;
  }

  if (demoMode && demoStatus === "invalid") {
    return <Navigate to="/landing" replace />;
  }

  return getAuthUserId() ? <>{children}</> : <Navigate to="/landing" replace />;
}

export default function Dashboard() {
  return (
    <>
      <Toaster richColors position="top-center" />
      <Analytics />
      <Routes>
        <Route path="/landing" element={<Landing />} />

        <Route
          path="/*"
          element={
            <RequireAuth>
              <SidebarLayout>
                <Routes>
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
