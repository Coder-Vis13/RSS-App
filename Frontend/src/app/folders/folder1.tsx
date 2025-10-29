import { useEffect, useState } from "react";
import { allUserSources, addSourceIntoFolder, folderItems as getFolderItems, delSourceFromFolder, markItemRead, markUserFolderItemsRead, saveItem } from "../../services/api";
import { Check, Bookmark } from "lucide-react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";



interface UserSources {
  source_id: number;
  source_name: string;
}

interface FolderItems {
  item_id: number;
  title: string;
  link: string;
  description: string;
  pub_date: string | Date;
  source_name: string;
  source_id: number;
  is_save: boolean;
}


export default function Folder1Page() {
  const [sources, setSources] = useState<UserSources[]>([]);
  const [folderItems, setFolderItems] = useState<FolderItems[]>([]);
  const [selectedSources, setSelectedSources] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const { folderId } = useParams<{ folderId: string }>();

  const userId = 3;

  useEffect(() => {
    if (!folderId) return;
    const fetchSources = async () => {
      try {
        const sourcedata = await allUserSources(userId);
        setSources(sourcedata);
      } catch (err) {
        console.error("Failed to load sources:", err);
      }
    };
    fetchSources();
  }, [userId]);

 const fetchFolderItems = async () => {
    try {
      const data = await getFolderItems(userId, Number(folderId));
      const normalized = data.map((i: any) => ({
        ...i,
        is_save: Boolean(i.is_save),
      }));
      setFolderItems(normalized);

      //Pre-select sources already in this folder
      const subscribedSources = Array.from(new Set(normalized.map((i: any) => i.source_id))) as number[];
      setSelectedSources(subscribedSources);
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

  const toggleSource = async (id: number) => {
      const alreadySelected = selectedSources.includes(id);
      setSelectedSources((prev) =>
        alreadySelected ? prev.filter((s) => s !== id) : [...prev, id]
      );

      try {
        if (alreadySelected) {
          await delSourceFromFolder(userId, Number(folderId), id);
        }
        else {
          await addSourceIntoFolder(userId, Number(folderId), id);
        }
        //refresh folder items
        await fetchFolderItems();
    } catch (err) {
      console.error("Error toggling source:", err);
    }
    }

  if (loading) return <p>Loading...</p>;

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


    const handleSave = async (itemId: number) => {
      const item = folderItems.find(i => i.item_id === itemId);
      if (!item) return;
    
      const intended = !item.is_save;
      setFolderItems(prev =>
        prev.map(i => (i.item_id === itemId ? { ...i, is_save: intended } : i))
      );
    
      try {
        await saveItem(userId, itemId, intended);
        await fetchFolderItems();
      } catch (err) {
        console.error("Failed to toggle save:", err);
        setFolderItems((prev) =>
        prev.map((i) => (i.item_id === itemId ? { ...i, is_save: !intended } : i)));
      }
    };

  return (
    <section className="mt-10 ml-5">
      <h3 className="mb-4 text-lg font-bold text-[var(--text)]">
        Choose the sources you wish to add to this folder
      </h3>

      {/*SOURCES*/}
      <div className="flex flex-wrap gap-3 mb-6">
        {sources.map((i) => {
          const isSelected = selectedSources.includes(i.source_id);

          return (
            <button
              key={i.source_id}
              type="button"
              onClick={() => toggleSource(i.source_id)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-150
                ${
                  isSelected
                    ? "bg-[var(--skyblue)] text-[var(--text)] border-[var(--skyblue)] shadow-sm"
                    : "border-[var(--navyblue)] text-[var(--text)] hover:bg-[var(--skyblue)] hover:border-[var(--skyblue)]"
                } active:scale-95`}
            >
              {isSelected && <Check size={16} className="text-[var(--text)]" />}
              <span>{i.source_name}</span>
            </button>
          );
        })}
      </div>

      {/*ITEMS*/}
      {folderItems.length > 0 ? (
        <div>
          <div className="mb-4 flex justify-end">
              <Button
                variant="ghost"
                className="text-[var(--text)] bg-[var(--light-grey)] hover:text-[var(--sidebar-active-foreground)] hover:bg-[var(--navyblue)]"
                onClick={() => handleMarkAsReadFolder()}
              >
                Mark all articles as read
              </Button>
            </div>
          <div className="flex flex-col divide-y divide-gray-300">
            {folderItems
              .filter((item) => selectedSources.includes(item.source_id))
              .map((item) => (
                <div
                  key={item.item_id}
                  className="py-4 flex justify-between items-start hover:bg-[var(--hover)] transition"
                >
                  <div className="flex-1 pr-4">
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
                          : "text-[var(--text-light)]"
                      }
                    />
                  </Button>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <p className="text-[var(--text-light)]">No items yet.</p>
      )}
    </section>
  );
}
