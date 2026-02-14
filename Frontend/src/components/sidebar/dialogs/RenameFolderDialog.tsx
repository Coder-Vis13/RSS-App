import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RenameFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderName: string;
  setFolderName: (name: string) => void;
  renameError: string | null;
  handleRenameFolder: () => void;
  resetState: () => void;
}

export function RenameFolderDialog({
  open,
  onOpenChange,
  folderName,
  setFolderName,
  renameError,
  handleRenameFolder,
  resetState,
}: RenameFolderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename folder</DialogTitle>
        </DialogHeader>

        <Input
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          placeholder="Folder name"
          autoFocus
        />

        {renameError && <p className="text-sm text-red-500">{renameError}</p>}

        <DialogFooter className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              resetState();
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleRenameFolder}>Rename</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
