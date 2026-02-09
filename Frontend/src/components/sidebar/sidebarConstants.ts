import { Home, List, Bookmark, BookOpen, ArrowDownUp } from "lucide-react";

export const navbarItems = [
  { label: "Home", icon: Home, path: "/home" },
  { label: "Feed", icon: List, path: "/feed" },
  { label: "Saved", icon: Bookmark, path: "/saved" },
  { label: "Priority", icon: ArrowDownUp, path: "/priority" },
  { label: "Recently Read", icon: BookOpen, path: "/recently-read" },
];