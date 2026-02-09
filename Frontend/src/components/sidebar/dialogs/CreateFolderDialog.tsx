import { Dialog } from "@radix-ui/react-dialog";
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";   
interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (folderName: string) => void;
}

export function CreateFolderDialog({ open, onClose, onCreate }: Props) {
  const [folderName, setFolderName] = useState("");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Folder</DialogTitle>
        </DialogHeader>
        <Input value={folderName} onChange={(e) => setFolderName(e.target.value)} />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onCreate(folderName); setFolderName(""); }}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
