import { Home, List, Bookmark, BookOpen, Plus } from "lucide-react";

export const navbarItems = [
  { label: "Discover", icon: Home, path: "/discover" },
  { label: "Feed", icon: List, path: "/feed" },
  { label: "Saved", icon: Bookmark, path: "/saved" },
  { label: "Recently Read", icon: BookOpen, path: "/recently-read" },
  { label: "Add Feed", icon: Plus, action: "add-feed" as const },
];
