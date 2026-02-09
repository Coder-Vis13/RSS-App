import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { UserFolder } from "../sidebarTypes";

interface AddToFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userFolders: UserFolder[];
  handleAddSourceToFolder: (folderId: number) => void;
  setCreateFolderDialogOpen: (open: boolean) => void;
}



export function AddSourceToFolderDialog({
  open,
  onOpenChange,
  userFolders,
  handleAddSourceToFolder,
  setCreateFolderDialogOpen,
}: AddToFolderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            onClick={() => setCreateFolderDialogOpen(true)}
          >
            <Plus className="h-4 w-4" /> Create New Folder
          </Button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
