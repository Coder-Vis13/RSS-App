import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ChevronLeft, ChevronRight, Ellipsis } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "../ui/separator";
import { toast } from "sonner";
import { navbarItems } from "./sidebarConstants";
import type { Source, UserFolder } from "./sidebarTypes";
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
  addUserSource,
} from "../../services/user.service";
import axios from "axios";

import { AddSourceToFolderDialog } from "./dialogs/AddSourceToFolderDialog";
import { RenameFolderDialog } from "./dialogs/RenameFolderDialog";
import { AddSourceDialog } from "./dialogs/AddSourceDialog";

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
  const [unfolderedSources, setUnfolderedSources] = useState<Source[]>([]);
  const [addToFolderOpen, setAddToFolderOpen] = useState(false);
  const [activeSourceId, setActiveSourceId] = useState<number | null>(null);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [addFeedDialogOpen, setAddFeedDialogOpen] = useState(false);

  const navigate = useNavigate();
  const userId = 1;
  const sidebarWidth = 260;

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
        const data = await getUserFolders(userId);
        setUserFolders(data);
        const initiallyOpen = new Set<number>();
        data.forEach((folder) => {
          if (folder.sources.length > 0) initiallyOpen.add(folder.folder_id);
        });
        setOpenFolders(initiallyOpen);
      } catch (err) {
        console.error(err);
      }
    };
    fetchFolders();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const fetchUnfoldered = async () => {
      try {
        const data = await getUnfolderedSources(userId);
        setUnfolderedSources(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUnfoldered();
  }, [userId]);

  const handleCreateFolder = async () => {
    if (!folderName.trim() || !userId) return;
    const newFolder = await createFolder(userId, folderName);
    setUserFolders([
      ...userFolders,
      {
        folder_id: newFolder.folder_id,
        name: newFolder.name ?? folderName,
        sources: [],
      },
    ]);
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
  };

  const handleRenameFolder = async () => {
    if (!renameUserFolder.trim() || selectedFolderId === null) return;
    try {
      const updatedFolder = await renameFolder(
        userId,
        selectedFolderId,
        renameUserFolder,
      );
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
      setRenameError(
        error.response?.status === 400
          ? error.response.data.error
          : "Something went wrong. Try again",
      );
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    await deleteFolder(userId, folderId);
    setUserFolders((prev) => prev.filter((f) => f.folder_id !== folderId));
  };

  const handleAddSourceToFolder = async (folderId: number) => {
    if (!activeSourceId) return;
    await addSourceIntoFolder(userId, folderId, activeSourceId);
    await refetchSidebarData();
    setAddToFolderOpen(false);
    setActiveSourceId(null);
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
  };

  const handleMarkSourceRead = async (sourceId: number) => {
    await markSourceItemsRead(userId, sourceId);
  };

  const handleAddSource = async (url: string) => {
    try {
      await addUserSource(userId, url);
      const unfolderedBefore = new Set(
        unfolderedSources.map((s) => s.source_id),
      );

      const { unfoldered } = await (async (): Promise<{
        unfoldered: Source[];
      }> => {
        const folders = await getUserFolders(userId);
        const unfoldered = await getUnfolderedSources(userId);
        setUserFolders(folders);
        setUnfolderedSources(unfoldered);
        return { unfoldered };
      })();

      const newlyAdded = unfoldered.find(
        (s) => !unfolderedBefore.has(s.source_id),
      );

      if (newlyAdded) {
        navigate(`/sources/${newlyAdded.source_id}`);
      }
      await refetchSidebarData();

      toast.success("Source added!");
    } catch (err) {
      let message = "Could not add the source. Please try a different URL.";
      if (axios.isAxiosError(err)) {
        message =
          err.response?.data?.message ?? err.response?.data?.error ?? message;
      }

      console.error("Failed to add feed", err);
      toast.error(message);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        style={{ width: sidebarWidth }}
        className="fixed left-0 top-0 h-full flex flex-col p-3 bg-[var(--sidebar)] border-r border-[var(--light-grey)] z-40 transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5 text-[var(--sidebar-foreground)]">
          <h1 className="text-xl font-bold">ReadArchive</h1>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-2">
          {navbarItems.map(({ label, icon: Icon, path, action }) => {
            if (action === "add-feed") {
              return (
                <button
                  key={label}
                  onClick={() => setAddFeedDialogOpen(true)}
                  className={`w-full text-sm flex items-center rounded-md px-3 py-2 transition-colors
    ${
      addFeedDialogOpen
        ? "bg-[var(--navyblue)] text-[var(--beige)]"
        : "hover:bg-[var(--light-grey)] text-[var(--text)]"
    }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="ml-2">{label}</span>
                </button>
              );
            }

            return (
              <NavLink
                key={label}
                to={path!}
                className={({ isActive }) =>
                  `w-full text-sm flex items-center rounded-md px-3 py-2 transition-colors
           ${
             isActive
               ? "bg-[var(--navyblue)] text-[var(--beige)]"
               : "hover:bg-[var(--light-grey)]"
           }`
                }
              >
                <Icon className="h-4 w-4" />
                <span className="ml-2">{label}</span>
              </NavLink>
            );
          })}
        </nav>

        <Separator className="bg-[#b0b0b0] mt-4" />

        {/* Unfoldered sources */}
        <nav className="space-y-1 mt-4 text-sm">
          {unfolderedSources.length > 0 &&
            unfolderedSources.map((source) => (
              <NavLink
                key={source.source_id}
                to={`/sources/${source.source_id}`}
                className={({ isActive }) =>
                  `block rounded-md transition-colors ${isActive ? "bg-[var(--navyblue)] text-[var(--beige)]" : "hover:bg-[var(--light-grey)] text-[var(--text)]"}`
                }
              >
                {({ isActive }) => (
                  <div className="mb-1 flex items-center justify-between px-2 py-1 group">
                    <span className="text-sm">{source.source_name}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 focus-visible:outline-none opacity-0 group-hover:opacity-100 transition-opacity focus-visible:ring-0">
                          <Ellipsis
                            className={`h-4 w-4 ${isActive ? "text-[var(--beige)]" : "text-gray-500"}`}
                          />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-44 rounded-xl border bg-white shadow-xl"
                      >
                        <DropdownMenuItem
                          onClick={() => handleMarkSourceRead(source.source_id)}
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

          <Separator className="bg-[#b0b0b0] mt-4 mb-4" />

          {/* Folders Header */}
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

          {/* Foldered sources */}
          {userFolders.map((folder) => {
            const isOpen = openFolders.has(folder.folder_id);
            return (
              <div key={folder.folder_id}>
                <NavLink
                  to={`/folders/${folder.folder_id}`}
                  className={({ isActive }) =>
                    `block rounded-md transition-colors ${isActive ? "bg-[var(--navyblue)] text-[var(--beige)]" : "hover:bg-[var(--light-grey)] text-[var(--text)]"}`
                  }
                >
                  {({ isActive }) => (
                    <div className="w-full flex items-center justify-between px-2 py-2 group">
                      <span>{folder.name}</span>
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
                                className={`h-4 w-4 ${isActive ? "text-[var(--beige)]" : "text-gray-500"}`}
                              />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={() => {
                                setRenameUserFolder(folder.name);
                                setSelectedFolderId(folder.folder_id);
                                setRenameModalOpen(true);
                              }}
                            >
                              Rename folder
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                if (confirm("Delete this folder?"))
                                  handleDeleteFolder(folder.folder_id);
                              }}
                              className="text-red-600 focus:text-red-600"
                            >
                              Delete folder
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

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
                            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </NavLink>

                {isOpen && folder.sources.length > 0 && (
                  <div className="ml-4 space-y-1">
                    {folder.sources.map((source) => (
                      <NavLink
                        key={source.source_id}
                        to={`/sources/${source.source_id}`}
                        className={({ isActive }) =>
                          `block rounded-md transition-colors ${isActive ? "bg-[var(--navyblue)] text-[var(--beige)]" : "hover:bg-[var(--light-grey)] text-[var(--text)]"}`
                        }
                      >
                        {({ isActive }) => (
                          <div className="flex items-center justify-between px-2 py-1 group">
                            <span className="text-sm">
                              {source.source_name}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1 focus-visible:outline-none focus-visible:ring-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Ellipsis
                                    className={`h-4 w-4 ${isActive ? "text-[var(--beige)]" : "text-gray-500"}`}
                                  />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleRemoveSourceFromFolder(
                                      folder.folder_id,
                                      source.source_id,
                                    )
                                  }
                                >
                                  Remove from folder
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleMarkSourceRead(source.source_id)
                                  }
                                >
                                  Mark all as read
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleRemoveSource(source.source_id)
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
        </nav>
      </aside>

      <AddSourceToFolderDialog
        open={addToFolderOpen}
        onOpenChange={setAddToFolderOpen}
        userFolders={userFolders}
        handleAddSourceToFolder={handleAddSourceToFolder}
        setCreateFolderDialogOpen={setCreateFolderDialogOpen}
      />

      <RenameFolderDialog
        open={renameModalOpen}
        onOpenChange={setRenameModalOpen}
        folderName={renameUserFolder}
        setFolderName={setRenameUserFolder}
        renameError={renameError}
        handleRenameFolder={handleRenameFolder}
        resetState={() => {
          setRenameModalOpen(false);
          setRenameUserFolder("");
          setSelectedFolderId(null);
          setRenameError(null);
        }}
      />

      <AddSourceDialog
        open={addFeedDialogOpen}
        onClose={() => setAddFeedDialogOpen(false)}
        onAdd={handleAddSource}
      />

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

      <main
        style={{
          marginLeft: sidebarWidth,
          width: `calc(100vw - ${sidebarWidth}px)`,
        }}
        className="h-full overflow-y-auto overflow-x-hidden bg-[var(--background)]"
      >
        <div className="max-w-6xl mx-auto w-full px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
