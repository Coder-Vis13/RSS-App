import { useEffect, useState } from "react";
import {
  folderItems as getFolderItems,
  markItemRead,
  markUserFolderItemsRead,
  saveItem,
} from "../../services/user.service";
import { Bookmark, ChevronDown } from "lucide-react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getCategoryPresentation } from "../../lib/categoryColors";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface FolderItems {
  item_id: number;
  title: string;
  link: string;
  description: string;
  pub_date: string | Date;
  source_name: string;
  source_id: number;
  is_save: boolean;
  categories?: { name: string; color: string }[];
}

export default function FolderPage() {
  const [folderItems, setFolderItems] = useState<FolderItems[]>([]);
  const [loading, setLoading] = useState(true);
  const { folderId } = useParams<{ folderId: string }>();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  const [blocklist, setBlocklist] = useState<string[]>([]);

  const feedType: "rss" = "rss";

  const userId = 1;

  useEffect(() => {
    const stored = localStorage.getItem("blocklist");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setBlocklist(parsed);
      } catch (e) {
        console.warn("Corrupted blocklist, ignoring");
      }
    }
  }, []);

  const fetchFolderItems = async () => {
    try {
      const data = await getFolderItems(userId, Number(folderId));
      const normalized = data.map((i: any) => ({
        ...i,
        is_save: Boolean(i.is_save),
      }));

      setFolderItems(normalized);

      const allCats: string[] = normalized.flatMap(
        (i: FolderItems) => i.categories?.map((cat) => cat.name) ?? [],
      );

      setUniqueCategories(["all", ...Array.from(new Set<string>(allCats))]);
    } catch (err) {
      console.error("Failed to load folder items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!folderId) return;
    fetchFolderItems();
  }, [folderId]);

  if (loading) return <p>Loading...</p>;

  const filterWithBlocklist = (items: FolderItems[], blocklist: string[]) => {
    return items.filter((item) => {
      const title = (item.title || "").toLowerCase();
      const desc = (item.description || "").toLowerCase();
      return !blocklist.some(
        (word) => title.includes(word) || desc.includes(word),
      );
    });
  };

  const handleMarkAsRead = async (itemId: number) => {
    try {
      await markItemRead(userId, itemId, feedType);
      setFolderItems((prev) => prev.filter((item) => item.item_id !== itemId));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAsReadFolder = async () => {
    if (!folderId) return;
    try {
      await markUserFolderItemsRead(userId, Number(folderId));
      await fetchFolderItems();
    } catch (err) {
      console.error("Failed to mark folder items as read:", err);
    }
  };

  const handleSave = async (itemId: number) => {
    const item = folderItems.find((i) => i.item_id === itemId);
    if (!item) return;

    const intended = !item.is_save;
    setFolderItems((prev) =>
      prev.map((i) => (i.item_id === itemId ? { ...i, is_save: intended } : i)),
    );

    try {
      await saveItem(userId, itemId, intended, feedType);
      await fetchFolderItems();
    } catch (err) {
      console.error("Failed to toggle save:", err);
      setFolderItems((prev) =>
        prev.map((i) =>
          i.item_id === itemId ? { ...i, is_save: !intended } : i,
        ),
      );
    }
  };

  return (
    <section className="mt-10 ml-5">
      <h3 className="mb-4 text-lg font-bold text-[var(--text)]"></h3>

      {folderItems.length > 0 ? (
        <div>
          <div className="mb-4 flex justify-end items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center text-md font-semibold hover:bg-[var(--light-grey)] hover:text-[var(--accent)] focus:outline-none focus:ring-0 focus-visible:ring-0"
                >
                  Category
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="bg-white border border-gray-100 rounded-md shadow-md"
              >
                <DropdownMenuItem
                  onClick={() => setCategoryFilter("all")}
                  className={`cursor-pointer transition-colors ${
                    categoryFilter === "all"
                      ? "bg-[var(--navyblue)] text-white"
                      : "hover:bg-[var(--light-grey)] hover:text-[var(--accent)]"
                  }`}
                >
                  All Categories
                </DropdownMenuItem>

                {uniqueCategories
                  .filter((cat) => cat !== "all")
                  .map((cat) => (
                    <DropdownMenuItem
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`cursor-pointer transition-colors ${
                        categoryFilter === cat
                          ? "bg-[var(--navyblue)] text-white"
                          : "hover:bg-[var(--light-grey)] hover:text-[var(--accent)]"
                      }`}
                    >
                      {cat}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              className="text-[var(--text)] bg-[var(--light-grey)] hover:text-[var(--sidebar-active-foreground)] hover:bg-[var(--navyblue)]"
              onClick={() => handleMarkAsReadFolder()}
            >
              Mark all articles as read
            </Button>
          </div>
          <div className="flex flex-col divide-y divide-gray-300">
            {filterWithBlocklist(folderItems, blocklist)
              .filter((item) => {
                return (
                  categoryFilter === "all" ||
                  item.categories?.some((c) => c.name === categoryFilter)
                );
              })
              .map((item) => (
                <div
                  key={item.item_id}
                  className="py-4 flex justify-between items-start hover:bg-[var(--hover)] transition"
                >
                  <div className="flex-1 pr-4">
                    {item.categories && item.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {item.categories.map((cat) => {
                          const {
                            className: backendClasses,
                            style: backendStyle,
                          } = getCategoryPresentation(cat.color, cat.name);

                          return (
                            <span
                              key={cat.name}
                              className={`text-[12px] px-2 py-0.5 rounded-full ${backendClasses}`}
                              style={backendStyle}
                            >
                              {cat.name}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleMarkAsRead(item.item_id)}
                      className="text-[var(--accent)] hover:underline font-medium"
                    >
                      {item.title}
                    </a>
                    {item.description && (
                      <p className="text-[var(--text)] text-sm mt-1 line-clamp-3">
                        {item.description}
                      </p>
                    )}
                    {item.pub_date && (
                      <p className="text-xs text-[var(--text-light)] mt-2">
                        [{item.source_name} •{" "}
                        {new Date(item.pub_date).toLocaleDateString()}]
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleSave(item.item_id)}
                  >
                    <Bookmark
                      size={24}
                      className={
                        item.is_save
                          ? "text-[var(--accent)] fill-[var(--accent)]"
                          : "text-gray-400"
                      }
                    />
                  </Button>
                </div>
              ))}
          </div>
        </div>
      ) : (
        //Empty state banner
        <div className="flex flex-col items-center justify-center h-[90vh] text-center">
          <img
            src="/folderImage.png"
            alt="No content in this folder"
            className="w-56 mb-6 opacity-90"
          />
          <p className="text-lg font-semibold text-[var(--text)]">
            This folder is empty
          </p>
          <p className="mt-2 text-sm text-[var(--text-light)] max-w-sm">
            Add sources to this folder to start curating your reading feed.
          </p>
        </div>
      )}
    </section>
  );
}
