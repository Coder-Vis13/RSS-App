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
  addSourceIntoFolder,
} from "../services/api";
import { Separator } from "./ui/separator";

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
  const [folderName, setFolderName] = useState("");
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameUserFolder, setRenameUserFolder] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [userFolders, setUserFolders] = useState<UserFolder[]>([]);
  const [openFolders, setOpenFolders] = useState<Set<number>>(new Set());
  const [unfolderedSources, setUnfolderedSources] = useState<
    { source_id: number; source_name: string }[]
  >([]);
  const [addToFolderOpen, setAddToFolderOpen] = useState(false);
  const [activeSourceId, setActiveSourceId] = useState<number | null>(null);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);

  const navigate = useNavigate();

  const userId = 1;

  const refetchSidebarData = async () => {
    const folders = await getUserFolders(userId);
    const unfoldered = await getUnfolderedSources(userId);

    setUserFolders(folders);
    setUnfolderedSources(unfoldered);
  };

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
    if (!folderName.trim() || !userId) return;

    try {
      const newFolder = await createFolder(userId, folderName);

      setUserFolders((prev) => [
        ...prev,
        {
          folder_id: newFolder.folder_id,
          folder_name: newFolder.name ?? folderName,
          sources: [],
        },
      ]);

      // If coming from "add source to folder"
      if (activeSourceId) {
        await addSourceIntoFolder(userId, newFolder.folder_id, activeSourceId);

        setUserFolders((prev) =>
          prev.map((f) =>
            f.folder_id === newFolder.folder_id
              ? {
                  ...f,
                  sources: [
                    ...f.sources,
                    unfolderedSources.find(
                      (s) => s.source_id === activeSourceId,
                    )!,
                  ],
                }
              : f,
          ),
        );

        setUnfolderedSources((prev) =>
          prev.filter((s) => s.source_id !== activeSourceId),
        );

        setActiveSourceId(null);
      }
      navigate(`/folders/${newFolder.folder_id}`);
      setFolderName("");
      setCreateFolderDialogOpen(false);
      setAddToFolderOpen(false);
    } catch (err) {
      console.error("Error creating folder:", err);
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
            ? { ...f, folder_name: updatedFolder.name }
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

  const handleRemoveSourceFromFolder = async (
    folderId: number,
    sourceId: number,
  ) => {
    await delSourceFromFolder(userId, folderId, sourceId);
    await refetchSidebarData();
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
    await refetchSidebarData();
    setAddToFolderOpen(false);
    setActiveSourceId(null);
  };

  const sidebarWidth = 260;
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        style={{ width: sidebarWidth }}
        className="fixed left-0 top-0 h-full flex flex-col p-3 bg-[var(--sidebar)] border-r border-[var(--light-grey)] z-40 transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5 text-[var(--sidebar-foreground)]">
          <h1 className="text-xl font-bold">ReadArchive</h1>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navbarItems.map(({ label, icon: Icon, path }) => (
            <NavLink
              key={label}
              to={path}
              className={({ isActive }) =>
                `w-full text-sm flex rounded-md px-3 py-2 transition-colors items-center
              ${isActive ? "bg-[var(--navyblue)] text-[var(--beige)]" : "hover:bg-[var(--light-grey)]"}`
              }
            >
              <Icon className="h-4 w-4" />
              <span className="ml-2">{label}</span>
            </NavLink>
          ))}

          {/* Horizontal separator */}
        </nav>
        <Separator className="bg-[#b0b0b0] mt-4" />

        {/* Folders */}
        <nav className="space-y-1 mt-4 text-sm">
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
                    <div className="mb-1 flex items-center justify-between px-2 py-1 group">
                      <span className="text-sm">{source.source_name}</span>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 focus-visible:outline-none opacity-0 group-hover:opacity-100 transition-opacity focus-visible:ring-0">
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
                            Mark all as read
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setActiveSourceId(source.source_id);
                              setAddToFolderOpen(true);
                            }}
                          >
                            Add to folder
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleRemoveSource(source.source_id)}
                            className="text-red-600 hover:text-red-600 focus:text-red-600 hover:bg-red-50"
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

          {/* Horizontal separator after unfoldered sources */}
          <Separator className="bg-[#b0b0b0] mt-4 mb-4" />

          {/* Folders header with + icon */}
          <div className="flex items-center justify-between px-2 mb-4 font-semibold text-[var(--sidebar-foreground)]">
            <span>Folders</span>
            <button
              onClick={() => {
                setFolderName("");
                setCreateFolderDialogOpen(true);
              }}
              className="p-1 rounded hover:bg-[var(--light-grey)]"
              aria-label="Create Folder"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

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
                    <div className="w-full flex items-center justify-between px-2 py-2 group">
                      <span>{folder.folder_name}</span>
                      <div className="flex items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Ellipsis
                                className={`h-4 w-4 ${
                                  isActive
                                    ? "text-[var(--beige)]"
                                    : "text-gray-500"
                                }`}
                              />
                            </button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={() => {
                                setRenameUserFolder(folder.folder_name);
                                setSelectedFolderId(folder.folder_id);
                                setRenameModalOpen(true);
                              }}
                            >
                              Rename folder
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => {
                                if (confirm("Delete this folder?")) {
                                  handleDeleteFolder(folder.folder_id);
                                }
                              }}
                            >
                              Delete folder
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {/* Chevron */}
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
                        >
                          <ChevronRight
                            className={`h-4 w-4 transition-transform ${
                              isOpen ? "rotate-90" : ""
                            }`}
                          />
                        </button>
                      </div>
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
                          <div className="flex items-center justify-between px-2 py-1 group">
                            <span className="text-sm">
                              {source.source_name}
                            </span>

                            {/* Ellipsis menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                  onClick={() => {
                                    handleRemoveSourceFromFolder(folder.folder_id, source.source_id);
                                  }}
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
                                  Mark all as read
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    removeUserSource(userId, source.source_id)
                                  }
                                  className="text-red-600 hover:text-red-600 focus:text-red-600 hover:bg-red-50"
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
          {/* Add to Folder Dialog */}
          <Dialog open={addToFolderOpen} onOpenChange={setAddToFolderOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Add to Folder</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Existing folders */}
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {userFolders.map((folder) => (
                    <button
                      key={folder.folder_id}
                      onClick={() => handleAddSourceToFolder(folder.folder_id)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--light-grey)] transition flex justify-between items-center focus-visible:outline-none"
                    >
                      {folder.folder_name}
                    </button>
                  ))}
                </div>

                {/* Secondary button to open Create Folder dialog */}
                <Button
                  variant="outline"
                  className="flex items-center justify-center w-full gap-2"
                  onClick={() => {
                    setCreateFolderDialogOpen(true); // open separate create folder dialog
                  }}
                >
                  <Plus className="h-4 w-4" /> Create New Folder
                </Button>
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

          {/* Create Folder Dialog */}
          <Dialog
            open={createFolderDialogOpen}
            onOpenChange={setCreateFolderDialogOpen}
          >
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-4">
                  {activeSourceId && (
                    <button
                      onClick={() => {
                        setCreateFolderDialogOpen(false);
                        setAddToFolderOpen(true);
                      }}
                      className="rounded-md p-1 hover:bg-[var(--light-grey)] focus:outline-none"
                      aria-label="Back"
                    >
                      <ChevronLeft className="h-4 w-4 text-[var(--sidebar-foreground)]" />
                    </button>
                  )}
                </div>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <Input
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Folder name"
                />
              </div>

              <DialogFooter className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setCreateFolderDialogOpen(false);
                    setFolderName("");
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateFolder}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={renameModalOpen} onOpenChange={setRenameModalOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Rename folder</DialogTitle>
              </DialogHeader>

              <Input
                value={renameUserFolder}
                onChange={(e) => setRenameUserFolder(e.target.value)}
                placeholder="Folder name"
                autoFocus
              />

              {renameError && (
                <p className="text-sm text-red-500">{renameError}</p>
              )}

              <DialogFooter className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setRenameModalOpen(false);
                    setRenameUserFolder("");
                    setSelectedFolderId(null);
                    setRenameError(null);
                  }}
                >
                  Cancel
                </Button>

                <Button onClick={handleRenameFolder}>Rename</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </nav>
      </aside>
    <main
  style={{
    marginLeft: sidebarWidth,
    width: `calc(100vw - ${sidebarWidth}px)`,
  }}
  className="h-full overflow-y-auto bg-[var(--background)]"
>
  <div className="max-w-6xl mx-auto w-full px-4 py-6">
    {children}
  </div>
</main>

    </div>
  );
}
