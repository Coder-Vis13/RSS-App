import {
  Home,
  List,
  Bookmark,
  BookOpen,
  ArrowDownUp,
  Plus,
} from "lucide-react";

export const navbarItems = [
  { label: "Discover", icon: Home, path: "/discover" },
  { label: "Feed", icon: List, path: "/feed" },
  { label: "Saved", icon: Bookmark, path: "/saved" },
  { label: "Priority", icon: ArrowDownUp, path: "/priority" },
  { label: "Recently Read", icon: BookOpen, path: "/recently-read" },
  { label: "Add Feed", icon: Plus, action: "add-feed" as const },
];
