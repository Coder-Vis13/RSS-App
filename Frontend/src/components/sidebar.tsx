

// /*
// Does this value affect what the user sees?
// YES → useState

// Does it need to survive a re-render?
// YES → useState

// If this value changes, should React re-render something on the page?
// Yes → useState
// */

import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Home,
  List,
  Bookmark,
  BookOpen,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowDownUp,
  Ellipsis,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  createFolder,
  getUserFolders,
  renameFolder,
  deleteFolder,
} from "../services/api";

// import { useAuth } from "../authContext";

const navbarItems = [
  { label: "Home", icon: Home, path: "/home" },
  { label: "Feed", icon: List, path: "/feed" },
  { label: "Saved", icon: Bookmark, path: "/saved" },
  { label: "Priority", icon: ArrowDownUp, path: "/priority" },
  { label: "Recently Read", icon: BookOpen, path: "/recently-read" },
];

interface UserFolders {
  folderId: number;
  name: string;
}

// export interface DBUser {
//   user_id: number;
//   email: string;
//   supabase_uid: string;
//   created_at: string;
//   created: boolean;
// }



export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [isSmallOpen, setIsSmallOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [userFolders, setUserFolders] = useState<UserFolders[]>([]);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameUserFolder, setRenameUserFolder] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);
  // const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const navigate = useNavigate();

  // const { dbUser, loading } = useAuth();
  // const userId = dbUser?.user_id;
  // console.log("dbUser = ", dbUser, "loading =", loading);
  // if (loading || !dbUser) return <div>Loading...</div>;
  const userId= 25;

  useEffect(() => {
  if (!userId) return; // wait for context to load

  const fetchFolders = async () => {
    try {
      const data = await getUserFolders(userId);
      const formatted = data.map((f: any) => ({
        folderId: f.folder_id,
        name: f.name,
      }));
      setUserFolders(formatted);
    } catch (err) {
      console.error("Failed to load user folders:", err);
    }
  };

  fetchFolders();
}, [userId]);


  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    setFolderName("");
    setOpenModal(false);
    try {
      if (!userId) return;
      const newFolder = await createFolder(userId, folderName);
      setUserFolders((prev) => [
        ...prev,
        { folderId: newFolder.folder_id, name: folderName },
      ]);
      navigate(`/folders/${newFolder.folder_id}`);
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  const handleRenameFolder = async () => {
    if (!renameUserFolder.trim() || selectedFolderId === null) return;
    try {
      if (!userId) return;
      const updatedFolder = await renameFolder(
        userId,
        selectedFolderId,
        renameUserFolder
      );
      if (!updatedFolder) throw new Error("No updated folder returned");
      setUserFolders((prev) =>
        prev.map((f) =>
          f.folderId === selectedFolderId ? { ...f, name: updatedFolder.name } : f
        )
      );
      setRenameModalOpen(false);
      setRenameError(null);
      setRenameUserFolder("");
      setSelectedFolderId(null);
    } catch (error: any) {
      if (error.response?.status === 400) {
        setRenameError(error.response.data.error);
      } else {
        setRenameError("Something went wrong. Try again");
      }
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    try {
      if (!userId) return;
      await deleteFolder(userId, folderId);
      setUserFolders((prev) => prev.filter((f) => f.folderId !== folderId));
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  };

  const sidebarWidth = isSmallOpen ? "70px" : "200px";

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside
        style={{ width: sidebarWidth }}
        className="fixed left-0 top-0 h-full flex flex-col p-3 bg-[var(--sidebar)] border-r border-gray-300 z-40 transition-all duration-300 overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5 text-[var(--sidebar-foreground)]">
          {!isSmallOpen && <h1 className="text-xl font-bold">ReadArchive</h1>}
          <Button
            onClick={() => setIsSmallOpen(!isSmallOpen)}
            variant="ghost"
            className="p-1 rounded"
          >
            {isSmallOpen ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navbarItems.map(({ label, icon: Icon, path }) => (
            <NavLink
              key={label}
              to={path}
              className={({ isActive }) =>
                `w-full text-sm flex rounded-md px-3 py-2 transition-colors items-center
                ${isSmallOpen ? "justify-center" : "justify-start"}
                ${
                  isActive
                    ? "bg-[var(--navyblue)] text-[var(--beige)]"
                    : "hover:bg-[var(--light-grey)]"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {!isSmallOpen && <span className="ml-2">{label}</span>}
            </NavLink>
          ))}

          {/* Add Feed & Folder */}
          {/* <NavLink
            to="/add-feed"
            className={({ isActive }) =>
              `w-full flex items-center rounded-md px-3 py-2 transition-colors border border-[var(--navyblue)]
              ${isSmallOpen ? "justify-center" : "justify-start"}
              ${
                isActive
                  ? "bg-[var(--navyblue)] text-[var(--beige)]"
                  : "hover:bg-[var(--light-grey)]"
              }`
            }
          >
            <Plus className="h-5 w-5" />
            {!isSmallOpen && <span className="ml-2">Add New Feed</span>}
          </NavLink> */}

          <button
            onClick={() => setOpenModal(true)}
            className={`w-full flex items-center rounded-md px-3 py-2 transition-colors border border-[var(--navyblue)]
            ${isSmallOpen ? "justify-center" : "justify-start"} hover:bg-[var(--light-grey)]`}
          >
            <Plus className="h-4 w-4" />
            {!isSmallOpen && <span className="ml-2 text-md">Create Folder</span>}
          </button>
        </nav>

        {/* Folders */}
        {!isSmallOpen && (
          <section>
            <h1 className="font-medium text-lg mt-8 ml-1">Your folders</h1>
          </section>
        )}

        <nav className="space-y-1 mt-2 text-sm">
          {userFolders.map((folder) => (
            <NavLink
              key={folder.folderId}
              to={`/folders/${folder.folderId}`}
              className={({ isActive }) =>
                `group w-full flex items-center rounded-md px-2 py-2 transition-colors
                ${isSmallOpen ? "justify-center" : "justify-start"}
                ${
                  isActive
                    ? "bg-[var(--navyblue)] text-[var(--beige)]"
                    : "hover:bg-[var(--light-grey)]"
                }`
              }
            >
              {!isSmallOpen && (
                <div className="ml-2 flex w-full items-center justify-between">
                  <span>{folder.name}</span>
                  <DropdownMenu
                    open={menuOpen === folder.folderId}
                    onOpenChange={(open) =>
                      setMenuOpen(open ? folder.folderId : null)
                    }
                  >
                    <DropdownMenuTrigger asChild>
                      <Ellipsis
                        className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                        onClick={(e) => e.preventDefault()}
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="bg-white rounded-sm"
                      align="end"
                      sideOffset={4}
                    >
                      <DropdownMenuItem
                        className="hover:bg-[var(--light-grey)]"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedFolderId(folder.folderId);
                          setRenameUserFolder(folder.name);
                          setRenameModalOpen(true);
                          setMenuOpen(null);
                        }}
                      >
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteFolder(folder.folderId);
                          setMenuOpen(null);
                        }}
                        className="text-red-600 hover:bg-[var(--light-grey)]"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content (adds left margin equal to sidebar width) */}
      <main
        style={{ marginLeft: sidebarWidth }}
        className="flex-1 h-full overflow-y-auto transition-all duration-300 p-6 bg-[var(--background)]"
      >
        {children}
      </main>

      {/* Create Folder Dialog */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="bg-white text-black rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Enter folder name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
          />
          <DialogFooter>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={renameModalOpen} onOpenChange={setRenameModalOpen}>
        <DialogContent className="bg-white text-black rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Enter new folder name"
            value={renameUserFolder}
            onChange={(e) => setRenameUserFolder(e.target.value)}
          />
          {renameError && (
            <p className="text-red-500 text-sm mt-2">{renameError}</p>
          )}
          <DialogFooter>
            <Button onClick={handleRenameFolder}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}









// import { useState, useEffect } from "react"
// import { NavLink } from "react-router-dom" 
// import { Button } from "@/components/ui/button"
// import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog"
// import { Input } from "@/components/ui/input"
// import { Home, List, Bookmark, BookOpen, Plus, ChevronLeft, ChevronRight, ArrowDownUp, Ellipsis } from "lucide-react"
// import { useNavigate } from "react-router-dom";
// import { createFolder, getUserFolders, renameFolder, deleteFolder } from "../services/api";
// import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, } from "@/components/ui/dropdown-menu"
// // import { toast } from "@/components/ui/sonner";

// const navbarItems = [
//   { label: "Home", icon: Home, path: "/home" },
//   { label: "Feed", icon: List, path: "/feed" },
//   { label: "Saved", icon: Bookmark, path: "/saved" },
//   { label: "Priority", icon: ArrowDownUp, path: "/priority" },
//   { label: "Recently Read", icon: BookOpen, path: "/recently-read" },
// ]

// interface UserFolders {
//   folderId: number;
//   name: string;
// }

// export default function Sidebar() {
//   const [isSmallOpen, setIsSmallOpen] = useState(false)
//   const [openModal, setOpenModal] = useState(false)
//   const [folderName, setFolderName] = useState("")
//   const [userFolders, setUserFolders] = useState<UserFolders[]>([]);
//   const [renameModalOpen, setRenameModalOpen] = useState(false);
//   const [renameUserFolder, setRenameUserFolder] = useState("");
//   const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null) 
//   const [menuOpen, setMenuOpen] = useState<number | null>(null); 
//   const [renameError, setRenameError] = useState<string | null>(null);
//   const navigate = useNavigate();
//   const userId = 3;

//    useEffect(() => {
//     const fetchFolders = async () => {
//       try {
//         const data = await getUserFolders(userId);
//         const formattedData = data.map((f: any) => ({ 
//           folderId: f.folder_id, 
//           name: f.name,
//         }));
//         setUserFolders(formattedData);
//       } catch (err) {
//         console.error("Failed to load user folders:", err);
//       }
//     };

//     fetchFolders();
//   }, [userId]);


//    const handleCreateFolder = async () => {
//     if (!folderName.trim()) return;
//     console.log("Creating folder:", folderName)
//     setFolderName("")
//     setOpenModal(false)
//     try { 
//     const newFolder = await createFolder(userId, folderName);
//     setUserFolders((prev) => [
//         ...prev,
//         { folderId: newFolder.folder_id, name: folderName }
//       ]);
//     navigate(`/folders/${newFolder.folder_id}`);
//   } catch (error) {
//     console.error("Error creating folder:", error);
//   }
//   }

//     const handleRenameFolder = async () => {
//     if (!renameUserFolder.trim() || selectedFolderId === null) return;
//     try { 
//     const updatedFolder = await renameFolder(userId, selectedFolderId, renameUserFolder);
//     if (!updatedFolder) throw new Error("No updated folder returned");
//     setUserFolders((prev) =>
//         prev.map((f) =>
//           f.folderId === selectedFolderId ? { ...f, name: updatedFolder.name } : f
//         )
//       );
//       setRenameModalOpen(false);
//       setRenameError(null);
//       setRenameUserFolder("");
//       setSelectedFolderId(null)
//     } catch (error: any) {
//       if (error.response?.status === 400) {
//       setRenameError(error.response.data.error);
//       } else {
//         setRenameError("Something went wrong. Try again");
//       }}
//   }

//     const handleDeleteFolder = async (folderId: number) => {
//     try { 
//     const deletedFolder = await deleteFolder(userId, folderId);
//     console.log("Deleted folder:", deletedFolder);
//     setUserFolders((prev) =>
//         prev.filter((f) =>
//           f.folderId !== folderId)
//         );
//     } catch (error) {
//       console.error("Error creating folder:", error);}
//   }


//   return (
//     <aside
//       className={`${isSmallOpen ? "w-18" : "w-50"} 
//       shrink-0 flex flex-col p-3 transition-[width] duration-300
//   h-screen overflow-y-auto bg-[var(--sidebar)] border-r border-[var(--sidebar-border)]`}
//     >
//       {/*app name and sidebar collapse button*/}
//       <div className="flex items-center justify-between mb-8 text-[var(--sidebar-foreground)]">
//         {!isSmallOpen && <h1 className="text-2xl font-bold">readArchive</h1>}
//         <Button
//           onClick={() => setIsSmallOpen(!isSmallOpen)}
//           variant="ghost"
//           className="p-1 rounded" >
//           {isSmallOpen ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
//         </Button>
//       </div>

//       {/*sidebar */}
//       <nav className="space-y-2">
//         {navbarItems.map(({ label, icon: Icon, path }) => (
//           <NavLink
//             key={label}
//             to={path}
//             className={({ isActive }) =>
//               `w-full flex rounded-md px-3 py-2 transition-colors items-center
//               ${isSmallOpen ? "justify-center h-12 px-0" : "justify-start"}
//               ${isActive ? "bg-[var(--navyblue)] text-[var(--beige)]" : "hover:bg-[var(--light-grey)]"}`
//             }
//           >
//             <Icon className="h-5 w-5" />
//             {!isSmallOpen && <span className="ml-2">{label}</span>}
//           </NavLink>
//         ))}

//         <NavLink
//           to="/add-feed"  //check if correct
//           className={({ isActive }) =>
//             `w-full flex items-center rounded-md px-3 py-2 transition-colors
//             ${isSmallOpen ? "justify-center h-12 px-0" : "justify-start"}
//             ${isActive ? "bg-[var(--navyblue)] text-[var(--beige)]" : "hover:bg-[var(--light-grey)] border border-[var(--navyblue)]"}`
//           }
//         >
//           <Plus className="h-5 w-5" />
//           {!isSmallOpen && <span className="ml-2">Add New Feed</span>}
//         </NavLink>

//         <button
//           onClick={() => setOpenModal(true)}
//           className={`w-full flex items-center rounded-md px-3 py-2 transition-colors
//           ${isSmallOpen ? "justify-center h-12 px-0" : "justify-start"}
//           hover:bg-[var(--light-grey)] border border-[var(--navyblue)]`}
//         >
//           <Plus className="h-5 w-5" />
//           {!isSmallOpen && <span className="ml-2">Create Folder</span>}
//         </button>

//       </nav>
//       {!isSmallOpen && (<section> 
//       <h1 className="font-medium text-lg mt-3 ml-1">Your folders</h1>
//       <Dialog open={openModal} onOpenChange={setOpenModal}>
//         <DialogContent className="bg-white text-black rounded-lg shadow-lg">
//           <DialogHeader>
//             <DialogTitle>Create New Folder</DialogTitle>
//           </DialogHeader>
//           <Input
//             placeholder="Enter folder name"
//             value={folderName}
//             onChange={(e) => setFolderName(e.target.value)}
//           />
//           <DialogFooter>
//             <Button onClick={handleCreateFolder}>Create</Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//       </section>)}
      
//       <section>    
//       <Dialog open={renameModalOpen} onOpenChange={setRenameModalOpen}>
//         <DialogContent className="bg-white text-black rounded-lg shadow-lg">
//           <DialogHeader>
//             <DialogTitle>Rename folder</DialogTitle>
//           </DialogHeader>
//           <Input
//             placeholder="Enter new folder name"
//             value={renameUserFolder}
//             onChange={(e) => setRenameUserFolder(e.target.value)}
//           />
//           {renameError && (
//           <p className="text-red-500 text-sm mt-2">{renameError}</p>
//           )}
//           <DialogFooter>
//             <Button onClick={handleRenameFolder}>Save</Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//       </section>  

//       <nav className="space-y-2 mt-1">
//       {userFolders.map((folder) => (
//         <NavLink
//           key={folder.folderId}
//           to={`/folders/${folder.folderId}`}
//           className={({ isActive }) =>
//             `group w-full flex items-center rounded-md px-1 py-1 transition-colors 
//             ${isSmallOpen ? "justify-center px-0" : "justify-start"}
//             ${isActive ? "bg-[var(--navyblue)] text-[var(--beige)]" : "hover:bg-[var(--light-grey)]"}`
//           }
//         >
//           {!isSmallOpen && (
//           <div className="ml-2 flex w-full items-center justify-between">
//             <span>{folder.name}</span>

//           <DropdownMenu  
//           open={menuOpen === folder.folderId}
//           onOpenChange={(open) => setMenuOpen(open ? folder.folderId : null)}>
//             <DropdownMenuTrigger asChild>
//               <Ellipsis
//                 className="h-4 w-4 mr-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
//                 onClick={(e) => e.preventDefault()} //Prevents NavLink navigation
//               />
//             </DropdownMenuTrigger>
//             <DropdownMenuContent className="bg-white rounded-sm" align="end" sideOffset={4}>
//               <DropdownMenuItem className="hover:bg-[var(--light-grey)]"
//                 onClick={(e) => {
//                   e.preventDefault()
//                   setSelectedFolderId(folder.folderId)
//                         setRenameUserFolder(folder.name)
//                         setRenameModalOpen(true)
//                         setMenuOpen(null);
//                   console.log("Renamed folder:", folder.folderId)
//                 }}
//               >
//                 Rename folder
//               </DropdownMenuItem>
//               <DropdownMenuItem 
//                 onClick={(e) => {
//                   e.preventDefault()
//                   console.log("Delete folder:", folder.folderId)
//                   setMenuOpen(null);
//                   handleDeleteFolder(folder.folderId);
//                 }}
//                 className="text-red-600 focus:text-red-600 hover:bg-[var(--light-grey)]"
//               >
//                 Delete folder
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>          
//           </div>)}
//         </NavLink>
//       ))}
//       </nav>
//     </aside>
//   )
// }













// // /*
// // Does this value affect what the user sees?
// // YES → useState

// // Does it need to survive a re-render?
// // YES → useState

// // If this value changes, should React re-render something on the page?
// // Yes → useState
// // */



// "use client" //run on the browser - needs React interactivity

// import { useState, useEffect } from "react"
// import { NavLink } from "react-router-dom" 
// import { Button } from "@/components/ui/button"
// import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog"
// import { Input } from "@/components/ui/input"
// import { Separator } from "@/components/ui/separator"
// import { Home, List, Bookmark, BookOpen, Plus, ChevronLeft, ChevronRight, ArrowDownUp, Ellipsis } from "lucide-react"
// import { useNavigate } from "react-router-dom";
// import { createFolder, getUserFolders, renameFolder, deleteFolder } from "../services/api";
// import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, } from "@/components/ui/dropdown-menu"
// // import { toast } from "@/components/ui/sonner";

// const navbarItems = [
//   { label: "Home", icon: Home, path: "/home" },
//   { label: "Feed", icon: List, path: "/feed" },
//   { label: "Saved", icon: Bookmark, path: "/saved" },
//   { label: "Priority", icon: ArrowDownUp, path: "/priority" },
//   { label: "Recently Read", icon: BookOpen, path: "/recently-read" },
// ]

// interface UserFolders {
//   folderId: number;
//   name: string;
// }

// export default function Sidebar() {
//   const [isSmallOpen, setIsSmallOpen] = useState(false)
//   const [openModal, setOpenModal] = useState(false)
//   const [folderName, setFolderName] = useState("")
//   const [userFolders, setUserFolders] = useState<UserFolders[]>([]);
//   const [renameModalOpen, setRenameModalOpen] = useState(false);
//   const [renameUserFolder, setRenameUserFolder] = useState("");
//   const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null) 
//   const [menuOpen, setMenuOpen] = useState<number | null>(null); 
//   const [renameError, setRenameError] = useState<string | null>(null);
//   const navigate = useNavigate();
//   const userId = 3;

//    useEffect(() => {
//     const fetchFolders = async () => {
//       try {
//         const data = await getUserFolders(userId);
//         const formattedData = data.map((f: any) => ({ 
//           folderId: f.folder_id, 
//           name: f.name,
//         }));
//         setUserFolders(formattedData);
//       } catch (err) {
//         console.error("Failed to load user folders:", err);
//       }
//     };

//     fetchFolders();
//   }, [userId]);


//    const handleCreateFolder = async () => {
//     if (!folderName.trim()) return;
//     console.log("Creating folder:", folderName)
//     setFolderName("")
//     setOpenModal(false)
//     try { 
//     const newFolder = await createFolder(userId, folderName);
//     setUserFolders((prev) => [
//         ...prev,
//         { folderId: newFolder.folder_id, name: folderName }
//       ]);
//     navigate(`/folders/${newFolder.folder_id}`);
//   } catch (error) {
//     console.error("Error creating folder:", error);
//   }
//   }

//     const handleRenameFolder = async () => {
//     if (!renameUserFolder.trim() || selectedFolderId === null) return;
//     try { 
//     const updatedFolder = await renameFolder(userId, selectedFolderId, renameUserFolder);
//     if (!updatedFolder) throw new Error("No updated folder returned");
//     setUserFolders((prev) =>
//         prev.map((f) =>
//           f.folderId === selectedFolderId ? { ...f, name: updatedFolder.name } : f
//         )
//       );
//       setRenameModalOpen(false);
//       setRenameError(null);
//       setRenameUserFolder("");
//       setSelectedFolderId(null)
//     } catch (error: any) {
//       if (error.response?.status === 400) {
//       setRenameError(error.response.data.error);
//       } else {
//         setRenameError("Something went wrong. Try again");
//       }}
//   }

//     const handleDeleteFolder = async (folderId: number) => {
//     try { 
//     const deletedFolder = await deleteFolder(userId, folderId);
//     console.log("Deleted folder:", deletedFolder);
//     setUserFolders((prev) =>
//         prev.filter((f) =>
//           f.folderId !== folderId)
//         );
//     } catch (error) {
//       console.error("Error creating folder:", error);}
//   }


//   return (
//     <aside
//       className={`${isSmallOpen ? "w-18" : "w-50"} 
//       shrink-0 bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] flex flex-col p-3 transition-[width] duration-300 min-h-screen`}
//     >
//       {/*app name and sidebar collapse button*/}
//       <div className="flex items-center justify-between mb-8 text-[var(--sidebar-foreground)]">
//         {!isSmallOpen && <h1 className="text-2xl font-bold">readArchive</h1>}
//         <Button
//           onClick={() => setIsSmallOpen(!isSmallOpen)}
//           variant="ghost"
//           className="p-1 rounded" >
//           {isSmallOpen ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
//         </Button>
//       </div>

//       {/*sidebar */}
//       <nav className="space-y-2">
//         {navbarItems.map(({ label, icon: Icon, path }) => (
//           <NavLink
//             key={label}
//             to={path}
//             className={({ isActive }) =>
//               `w-full flex rounded-md px-3 py-2 transition-colors items-center
//               ${isSmallOpen ? "justify-center h-12 px-0" : "justify-start"}
//               ${isActive ? "bg-[var(--navyblue)] text-[var(--beige)]" : "hover:bg-[var(--light-grey)]"}`
//             }
//           >
//             <Icon className="h-5 w-5" />
//             {!isSmallOpen && <span className="ml-2">{label}</span>}
//           </NavLink>
//         ))}

//         <NavLink
//           to="/add-feed"  //check if correct
//           className={({ isActive }) =>
//             `w-full flex items-center rounded-md px-3 py-2 transition-colors
//             ${isSmallOpen ? "justify-center h-12 px-0" : "justify-start"}
//             ${isActive ? "bg-[var(--navyblue)] text-[var(--beige)]" : "hover:bg-[var(--light-grey)] border border-[var(--navyblue)]"}`
//           }
//         >
//           <Plus className="h-5 w-5" />
//           {!isSmallOpen && <span className="ml-2">Add New Feed</span>}
//         </NavLink>

//         <button
//           onClick={() => setOpenModal(true)}
//           className={`w-full flex items-center rounded-md px-3 py-2 transition-colors
//           ${isSmallOpen ? "justify-center h-12 px-0" : "justify-start"}
//           hover:bg-[var(--light-grey)] border border-[var(--navyblue)]`}
//         >
//           <Plus className="h-5 w-5" />
//           {!isSmallOpen && <span className="ml-2">Create Folder</span>}
//         </button>

//       </nav>

//       {/*divider for the sidebar from shadcn*/}
//       <div>
//       <Separator className="my-6 h-full w-[1px] bg-[var(--sidebar-border)]" orientation="vertical" />
//       </div>
//       {!isSmallOpen && (<section> 
//       <h1 className="font-medium text-lg mt-3 ml-1">Your folders</h1>
//       <Dialog open={openModal} onOpenChange={setOpenModal}>
//         <DialogContent className="bg-white text-black rounded-lg shadow-lg">
//           <DialogHeader>
//             <DialogTitle>Create New Folder</DialogTitle>
//           </DialogHeader>
//           <Input
//             placeholder="Enter folder name"
//             value={folderName}
//             onChange={(e) => setFolderName(e.target.value)}
//           />
//           <DialogFooter>
//             <Button onClick={handleCreateFolder}>Create</Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//       </section>)}
      
//       <section>    
//       <Dialog open={renameModalOpen} onOpenChange={setRenameModalOpen}>
//         <DialogContent className="bg-white text-black rounded-lg shadow-lg">
//           <DialogHeader>
//             <DialogTitle>Rename folder</DialogTitle>
//           </DialogHeader>
//           <Input
//             placeholder="Enter new folder name"
//             value={renameUserFolder}
//             onChange={(e) => setRenameUserFolder(e.target.value)}
//           />
//           {renameError && (
//           <p className="text-red-500 text-sm mt-2">{renameError}</p>
//           )}
//           <DialogFooter>
//             <Button onClick={handleRenameFolder}>Save</Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//       </section>  

//       <nav className="space-y-2 mt-1">
//       {userFolders.map((folder) => (
//         <NavLink
//           key={folder.folderId}
//           to={`/folders/${folder.folderId}`}
//           className={({ isActive }) =>
//             `group w-full flex items-center rounded-md px-1 py-1 transition-colors 
//             ${isSmallOpen ? "justify-center px-0" : "justify-start"}
//             ${isActive ? "bg-[var(--navyblue)] text-[var(--beige)]" : "hover:bg-[var(--light-grey)]"}`
//           }
//         >
//           {!isSmallOpen && (
//           <div className="ml-2 flex w-full items-center justify-between">
//             <span>{folder.name}</span>

//           <DropdownMenu  
//           open={menuOpen === folder.folderId}
//           onOpenChange={(open) => setMenuOpen(open ? folder.folderId : null)}>
//             <DropdownMenuTrigger asChild>
//               <Ellipsis
//                 className="h-4 w-4 mr-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
//                 onClick={(e) => e.preventDefault()} //Prevents NavLink navigation
//               />
//             </DropdownMenuTrigger>
//             <DropdownMenuContent className="bg-white rounded-sm" align="end" sideOffset={4}>
//               <DropdownMenuItem className="hover:bg-[var(--light-grey)]"
//                 onClick={(e) => {
//                   e.preventDefault()
//                   setSelectedFolderId(folder.folderId)
//                         setRenameUserFolder(folder.name)
//                         setRenameModalOpen(true)
//                         setMenuOpen(null);
//                   console.log("Renamed folder:", folder.folderId)
//                 }}
//               >
//                 Rename folder
//               </DropdownMenuItem>
//               <DropdownMenuItem 
//                 onClick={(e) => {
//                   e.preventDefault()
//                   console.log("Delete folder:", folder.folderId)
//                   setMenuOpen(null);
//                   handleDeleteFolder(folder.folderId);
//                 }}
//                 className="text-red-600 focus:text-red-600 hover:bg-[var(--light-grey)]"
//               >
//                 Delete folder
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>          
//           </div>)}
//         </NavLink>
//       ))}
//       </nav>
//     </aside>
//   )
// }
