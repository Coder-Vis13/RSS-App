

"use client" //run on the browser - needs React interactivity

import { useState } from "react"
import { NavLink } from "react-router-dom" 
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Home, List, Bookmark, BookOpen, Plus, ChevronLeft, ChevronRight } from "lucide-react"

//change rules icon later
const navbarItems = [
  { label: "Home", icon: Home, path: "/home" },
  { label: "Feed", icon: List, path: "/feed" },
  { label: "Saved", icon: Bookmark, path: "/saved" },
  { label: "Rules", icon: BookOpen, path: "/rules" },
]

//add custom folders later
const folders = [
  { label: "Read Later", icon: Bookmark, path: "/read-later" },
  { label: "Recently Read", icon: BookOpen, path: "/recently-read" },
]

export default function Sidebar() {
  const [isSmallOpen, setIsSmallOpen] = useState(false)

  return (
    <aside
      className={`${isSmallOpen ? "w-18" : "w-50"} 
      shrink-0 bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] flex flex-col p-3 transition-[width] duration-300`}
    >
      {/*app name and sidebar collapse button*/}
      <div className="flex items-center justify-between mb-8 text-[var(--sidebar-foreground)]">
        {!isSmallOpen && <h1 className="text-2xl font-bold">MyRSS</h1>}  {/*change this later*/}
        <Button
          onClick={() => setIsSmallOpen(!isSmallOpen)}
          variant="ghost"
          className="p-1 rounded" >
          {isSmallOpen ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      {/*sidebar */}
      <nav className="space-y-2">
        {navbarItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={label}
            to={path}
            className={({ isActive }) =>
              `w-full flex  rounded-md px-3 py-2 transition-colors items-center
              ${isSmallOpen ? "justify-center h-12 px-0" : "justify-start"}
              ${isActive ? "bg-[var(--navyblue)] text-[var(--beige)]" : "hover:bg-[var(--light-grey)]"}`
            }
          >
            <Icon className="h-5 w-5" />
            {!isSmallOpen && <span className="ml-2">{label}</span>}
          </NavLink>
        ))}

        <NavLink
          to="/add-feed"  //check if correct
          className={({ isActive }) =>
            `w-full flex items-center rounded-md px-3 py-2 transition-colors
            ${isSmallOpen ? "justify-center h-12 px-0" : "justify-start"}
            ${isActive ? "bg-[var(--navyblue)] text-[var(--beige)]" : "hover:bg-[var(--light-grey)] border border-[var(--navyblue)]"}`
          }
        >
          <Plus className="h-5 w-5" />
          {!isSmallOpen && <span className="ml-2">Add New Feed</span>}
        </NavLink>
      </nav>

      {/*divider for the sidebar from shadcn*/}
      <Separator className="my-6 bg-[var(--sidebar-border)]" />

      {/* default folders */}
      <nav className="space-y-2">
        {folders.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={label}
            to={path}
            className={({ isActive }) =>
              `w-full flex items-center rounded-md px-3 py-2 transition-colors
              ${isSmallOpen ? "justify-center h-12 px-0" : "justify-start"}
              ${isActive ? "bg-[var(--navyblue)] text-[var(--beige)]" : "hover:bg-[var(--light-grey)]"}`
            }
          >
            <Icon className="h-5 w-5" />
            {!isSmallOpen && <span className="ml-2">{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}



