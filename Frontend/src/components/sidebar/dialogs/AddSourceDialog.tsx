import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (url: string) => Promise<void>;
  feedType?: "rss" | "podcast";
}

export function AddSourceDialog({
  open,
  onClose,
  onAdd,
  feedType = "rss",
}: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      await onAdd(url);
      setUrl("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        {loading ? (
          /* LOADING STATE */
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-neutral-600" />
            <p className="mt-4 text-sm text-muted-foreground">
              Hang tight. We’re adding your source.
            </p>
          </div>
        ) : (
          /* FORM STATE */
          <>
            <DialogHeader>
              <DialogTitle>
                Add {feedType === "rss" ? "Feed" : "Podcast"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Add a website link to start getting new articles in your feed.
              </p>
            </DialogHeader>

            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />

            <DialogFooter className="flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleAdd}>Add</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
