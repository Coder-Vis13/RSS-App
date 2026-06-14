import { useEffect, useState } from "react";
import {
  folderItems as getFolderItems,
  markItemRead,
  markUserFolderItemsRead,
  saveItem,
} from "../../services/user.service";
import { Bookmark } from "lucide-react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getCategoryPresentation } from "../../lib/categoryColors";


import AppHeader from "@/components/layout/AppHeader";
import { useBlocklist } from "@/context/blocklistContext";

interface FolderItems {
  item_id: number;
  title: string;
  link: string;
  description: string;
  pub_date: string;
  source_name: string;
  source_id: number;
  is_save: boolean;
  categories?: { name: string; color: string }[];
  feed_type: "rss" | "podcast";
}

export default function FolderPage() {
  const [folderItems, setFolderItems] = useState<FolderItems[]>([]);
  const [loading, setLoading] = useState(true);
  const { folderId } = useParams<{ folderId: string }>();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  // const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<"all" | "today" | "week" | "month">("all");
  const [feedType, setFeedType] = useState<"rss" | "podcast">("rss");
  const [allCategories, setAllCategories] = useState<string[]>([]);

  const userId = 1;

  const { blocklist } = useBlocklist();

  const fetchFolderItems = async () => {
    try {
      const data = await getFolderItems(userId, Number(folderId), selectedTime);
      const normalized = data.map((i: any) => ({
        ...i,
        is_save: Boolean(i.is_save),
      }));

      setFolderItems(normalized);

      const allCats: string[] = normalized.flatMap(
        (i: FolderItems) => i.categories?.map((cat) => cat.name) ?? [],
      );

      const unique = Array.from(new Set(allCats));
      setAllCategories(unique);
    } catch (err) {
      console.error("Failed to load folder items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!folderId) return;
    fetchFolderItems();
  }, [folderId, selectedTime]);

  useEffect(() => {
  setSelectedCategory("All");
}, [feedType]);

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
      await markItemRead(userId, itemId);
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

  const handleCategorySelect = (category: string) => {
  setSelectedCategory(category);
};

  const handleSave = async (itemId: number) => {
    const item = folderItems.find((i) => i.item_id === itemId);
    if (!item) return;

    const intended = !item.is_save;
    setFolderItems((prev) =>
      prev.map((i) => (i.item_id === itemId ? { ...i, is_save: intended } : i)),
    );

    try {
      await saveItem(userId, itemId, intended);
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
    <section className="flex min-h-screen w-full">
      <h3 className="mb-4 text-lg font-bold text-[var(--text)]"></h3>

      {folderItems.length > 0 ? (
        <div className="flex-1 w-full">
          <AppHeader 
                        feedType={feedType}
                        setFeedType={setFeedType}
                        selectedCategory={selectedCategory}
                        onCategorySelect={handleCategorySelect}
                        categories={allCategories}
                        selectedTime={selectedTime}
                        setSelectedTime={setSelectedTime}
                        onMarkAllRead={handleMarkAsReadFolder}
                      />
          <div className="px-6">
            <section className="max-w-[1100px] mx-auto">
              <div className="flex flex-col divide-y divide-gray-300">
            {filterWithBlocklist(folderItems, blocklist)
              .filter((item) => item.feed_type === feedType)
              .filter((item) => {
                return (
                  selectedCategory === "All" ||
                  item.categories?.some((c) => c.name === selectedCategory)
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
              </section>
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
