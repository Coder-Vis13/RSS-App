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
  getUnfolderedSources,
  delSourceFromFolder,
  removeUserSource,
  markSourceItemsRead,
  markUserFolderItemsRead,
  addSourceIntoFolder,
} from "../services/api";

const navbarItems = [
  { label: "Home", icon: Home, path: "/home" },
  { label: "Feed", icon: List, path: "/feed" },
  { label: "Saved", icon: Bookmark, path: "/saved" },
  { label: "Priority", icon: ArrowDownUp, path: "/priority" },
  { label: "Recently Read", icon: BookOpen, path: "/recently-read" },
];

interface UserFolder {
  folder_id: number;
  folder_name: string;
  sources: {
    source_id: number;
    source_name: string;
  }[];
}

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSmallOpen, setIsSmallOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameUserFolder, setRenameUserFolder] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [userFolders, setUserFolders] = useState<UserFolder[]>([]);
  const [openFolders, setOpenFolders] = useState<Set<number>>(new Set());
  const [unfolderedSources, setUnfolderedSources] = useState<
    { source_id: number; source_name: string }[]
  >([]);
  const [addToFolderOpen, setAddToFolderOpen] = useState(false);
  const [activeSourceId, setActiveSourceId] = useState<number | null>(null);

  const navigate = useNavigate();

  const userId = 1;

  useEffect(() => {
    if (!userId) return;

    const fetchFolders = async () => {
      try {
        const data = (await getUserFolders(userId)) as UserFolder[];
        if (!Array.isArray(data)) {
          console.warn("Unexpected getUserFolders response:", data);
          return;
        }
        setUserFolders(data);
        const initiallyOpen = new Set<number>();
        data.forEach((folder: UserFolder) => {
          if (folder.sources.length > 0) {
            initiallyOpen.add(folder.folder_id);
          }
        });
        setOpenFolders(initiallyOpen);
      } catch (err) {
        console.error("Failed to load user folders:", err);
      }
    };

    fetchFolders();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const fetchUnfoldered = async () => {
      try {
        const data = await getUnfolderedSources(userId);
        console.log("Unfolered sources:", data);
        setUnfolderedSources(data);
      } catch (err) {
        console.error("Failed to load unfoldered sources:", err);
      }
    };

    fetchUnfoldered();
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
        {
          folder_id: newFolder.folder_id,
          folder_name: newFolder.name ?? folderName,
          sources: [],
        },
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
        renameUserFolder,
      );
      if (!updatedFolder) throw new Error("No updated folder returned");
      setUserFolders((prev) =>
        prev.map((f) =>
          f.folder_id === selectedFolderId
            ? { ...f, name: updatedFolder.name }
            : f,
        ),
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
      setUserFolders((prev) => prev.filter((f) => f.folder_id !== folderId));
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  };

  const handleMarkSourceRead = async (sourceId: number) => {
    await markSourceItemsRead(userId, sourceId);
  };

  const handleRemoveSource = async (sourceId: number) => {
    await removeUserSource(userId, sourceId);
    setUnfolderedSources((prev) =>
      prev.filter((s) => s.source_id !== sourceId),
    );
    setUserFolders((prev) =>
      prev.map((f) => ({
        ...f,
        sources: f.sources.filter((s) => s.source_id !== sourceId),
      })),
    );
  };

  const handleRemoveFromFolder = async (folderId: number, sourceId: number) => {
    await delSourceFromFolder(userId, folderId, sourceId);
    setUserFolders((prev) =>
      prev.map((f) =>
        f.folder_id === folderId
          ? { ...f, sources: f.sources.filter((s) => s.source_id !== sourceId) }
          : f,
      ),
    );
  };

  const handleAddSourceToFolder = async (folderId: number) => {
    if (activeSourceId === null) return;

    await addSourceIntoFolder(userId, folderId, activeSourceId);

    setUserFolders((prev) =>
      prev.map((f) =>
        f.folder_id === folderId
          ? {
              ...f,
              sources: [
                ...f.sources,
                unfolderedSources.find((s) => s.source_id === activeSourceId)!,
              ],
            }
          : f,
      ),
    );

    setUnfolderedSources((prev) =>
      prev.filter((s) => s.source_id !== activeSourceId),
    );

    setAddToFolderOpen(false);
    setActiveSourceId(null);
  };

  const sidebarWidth = isSmallOpen ? "72px" : "280px";
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside
        style={{ width: sidebarWidth }}
        className="fixed left-0 top-0 h-full flex flex-col p-3 bg-[var(--sidebar)] border-r z-40 transition-all"
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
              ${isActive ? "bg-[var(--navyblue)] text-[var(--beige)]" : "hover:bg-[var(--light-grey)]"}`
              }
            >
              <Icon className="h-4 w-4" />
              {!isSmallOpen && <span className="ml-2">{label}</span>}
            </NavLink>
          ))}

          <button
            onClick={() => setOpenModal(true)}
            className={`w-full flex items-center rounded-md px-3 py-2 transition-colors border border-[var(--navyblue)]
          ${isSmallOpen ? "justify-center" : "justify-start"} hover:bg-[var(--light-grey)]`}
          >
            <Plus className="h-4 w-4" />
            {!isSmallOpen && (
              <span className="ml-2 text-md">Create Folder</span>
            )}
          </button>
        </nav>

        {/* Folders */}
        <nav className="space-y-1 mt-12 text-sm">
          {/* Unfoldered Sources */}
          {unfolderedSources.length > 0 && (
            <div className="mb-4">
              {[...unfolderedSources].map((source) => (
                <NavLink
                  key={source.source_id}
                  to={`/sources/${source.source_id}`}
                  className={({ isActive }) =>
                    `block rounded-md transition-colors ${
                      isActive
                        ? "bg-[var(--navyblue)] text-[var(--beige)]"
                        : "hover:bg-[var(--light-grey)] text-[var(--text)]"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <div className="flex items-center justify-between px-2 py-1">
                      <span className="text-sm">{source.source_name}</span>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1">
                            <Ellipsis
                              className={`h-4 w-4 ${
                                isActive
                                  ? "text-[var(--beige)]"
                                  : "text-gray-500"
                              }`}
                            />
                          </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                          align="end"
                          className="w-44 rounded-xl border bg-white shadow-xl"
                        >
                          <DropdownMenuItem
                            onClick={() =>
                              handleMarkSourceRead(source.source_id)
                            }
                          >
                            Mark all read
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRemoveSource(source.source_id)}
                            className="text-red-600"
                          >
                            Remove source
                          </DropdownMenuItem>
                          <DropdownMenuItem>Add to folder</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          )}

          {/* Foldered Sources */}
          {userFolders.map((folder) => {
            const isOpen = openFolders.has(folder.folder_id);

            return (
              <div key={folder.folder_id}>
                {/* Folder row */}
                <NavLink
                  to={`/folders/${folder.folder_id}`}
                  className={({ isActive }) =>
                    `block rounded-md transition-colors ${
                      isActive
                        ? "bg-[var(--navyblue)] text-[var(--beige)]"
                        : "hover:bg-[var(--light-grey)] text-[var(--text)]"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <div className="w-full flex items-center justify-between px-2 py-2 font-semibold">
                      <span>{folder.folder_name}</span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const next = new Set(openFolders);
                          isOpen
                            ? next.delete(folder.folder_id)
                            : next.add(folder.folder_id);
                          setOpenFolders(next);
                        }}
                        className="ml-2"
                      >
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${
                            isOpen ? "rotate-90" : ""
                          } ${isActive ? "text-[var(--beige)]" : ""}`}
                        />
                      </button>
                    </div>
                  )}
                </NavLink>
                {/* Sources inside folder */}
                {isOpen && folder.sources.length > 0 && (
                  <div className="ml-4 space-y-1">
                    {folder.sources.map((source) => (
                      <NavLink
                        key={source.source_id}
                        to={`/sources/${source.source_id}`}
                        className={({ isActive }) =>
                          `block rounded-md transition-colors ${
                            isActive
                              ? "bg-[var(--navyblue)] text-[var(--beige)]"
                              : "hover:bg-[var(--light-grey)] text-[var(--text)]"
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <div className="flex items-center justify-between px-2 py-1">
                            <span className="text-sm">
                              {source.source_name}
                            </span>

                            {/* Ellipsis menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1">
                                  <Ellipsis
                                    className={`h-4 w-4 ${
                                      isActive
                                        ? "text-[var(--beige)]"
                                        : "text-gray-500"
                                    }`}
                                  />
                                </button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    delSourceFromFolder(
                                      userId,
                                      folder.folder_id,
                                      source.source_id,
                                    )
                                  }
                                >
                                  Remove from folder
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    markSourceItemsRead(
                                      userId,
                                      source.source_id,
                                    )
                                  }
                                >
                                  Mark all read
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    removeUserSource(userId, source.source_id)
                                  }
                                >
                                  Remove source
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <Dialog open={addToFolderOpen} onOpenChange={setAddToFolderOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Add to Folder</DialogTitle>
              </DialogHeader>

              <div className="space-y-2">
                {userFolders.map((folder) => (
                  <button
                    key={folder.folder_id}
                    onClick={() => handleAddSourceToFolder(folder.folder_id)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--light-grey)] transition"
                  >
                    {folder.folder_name}
                  </button>
                ))}
              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setAddToFolderOpen(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </nav>
      </aside>
    </div>
  );
}
