import { useState, useEffect } from "react";
import { Search, Bookmark, X, ChevronDown } from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { readItems } from "../../services/user.service";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import {
  userFeedItems,
  markItemRead,
  saveItem,
  markUserFeedItemsRead,
  addUserSource,
  addUserPodcast,
  // removeUserSource,
  getItemsByCategory,
  // allUserPodcastSources,
} from "../../services/user.service";

import { getCategoryPresentation } from "../../lib/categoryColors";


interface FeedItems {
  item_id: number;
  title: string;
  link: string;
  description: string;
  pub_date: string | Date;
  source_name: string;
  is_save: boolean;
  source_id?: number;
  categories?: { name: string; color: string }[];
}

// interface UserSources {
//   source_id: number;
//   source_name: string;
//   logo_url: string;
// }

export default function FeedPage() {
  const [feedItems, setFeedItems] = useState<FeedItems[]>([]);
  // const [sources, setSources] = useState<UserSources[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [addingSource, setAddingSource] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [feedType, setFeedType] = useState<"rss" | "podcast">("rss");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [readCount, setReadCount] = useState(0);

  // Blocklist states
  const [blockInput, setBlockInput] = useState("");
  const [expandedSources, setExpandedSources] = useState<
    Record<string, boolean>
  >({});


  const userId = 1;



useEffect(() => {
  let cancelled = false;

  const fetchReadCount = async () => {
    try {
      const items = await readItems(userId, feedType);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayCount = items.filter((item: any) => {
        if (!item.read_time) return false;
        const d = new Date(item.read_time);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      }).length;

      if (!cancelled) setReadCount(todayCount);
    } catch (err) {
      console.error("Failed to load read count:", err);
    }
  };

  fetchReadCount();
  const intervalId = window.setInterval(fetchReadCount, 10_000);

  return () => {
    cancelled = true;
    window.clearInterval(intervalId);
  };
}, [userId, feedType]);



  const [blocklist, setBlocklist] = useState<string[]>(() => {
    // initialize from localStorage
    const stored = localStorage.getItem("blocklist");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.warn("Corrupted blocklist, ignoring");
      }
    }
    return [];
  });

  //Fetch feed
  useEffect(() => {
    if (!userId) return; 

    const fetchFeed = async () => {
      setLoading(true);
      try {
        const data = await userFeedItems(userId, feedType);
        const normalized = data.map((i: any) => ({
          ...i,
          is_save: Boolean(i.is_save),
        }));
        setFeedItems(normalized);

        const uniqueCategories: string[] = Array.from(
          new Set(
            data.flatMap((i: any) =>
              (i.categories || []).map((c: any) =>
                c && c.name ? c.name : "Uncategorized",
              ),
            ),
          ),
        );
        setAllCategories(uniqueCategories);
      } catch (err) {
        console.error("Failed to load feed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [userId, feedType]);


  // Blocklist load

  //Blocklist save
  useEffect(() => {
    localStorage.setItem("blocklist", JSON.stringify(blocklist));
  }, [blocklist]);

 
  const handleMarkAsRead = async (itemId: number) => {
    try {
      await markItemRead(userId, itemId, feedType);
      setFeedItems((i) => i.filter((item) => item.item_id !== itemId));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAsReadFeed = async () => {
    try {
      await markUserFeedItemsRead(userId, feedType);
      const updatedFeed = await userFeedItems(userId, feedType);
      const normalized = updatedFeed.map((i: any) => ({
        ...i,
        is_save: Boolean(i.is_save),
      }));
      setFeedItems(normalized);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleCategorySelect = async (category: string) => {
    setSelectedCategory(category);
    setLoading(true);
    try {
      if (category === "All") {
        const allItems = await userFeedItems(userId, feedType);
        const normalized = allItems.map((i: any) => ({
          ...i,
          is_save: Boolean(i.is_save),
        }));
        setFeedItems(normalized);
      } else {
        const catItems = await getItemsByCategory(userId, category, feedType);
        if (Array.isArray(catItems)) {
          const normalized = catItems.map((i: any) => ({
            ...i,
            is_save: Boolean(i.is_save),
          }));
          setFeedItems(normalized);
        } else {
          console.error("Unexpected data format from getItemsByCategory");
        }
      }
    } catch (err) {
      console.error("Failed to fetch items by category:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (itemId: number) => {
    const item = feedItems.find((i) => i.item_id === itemId);
    if (!item) return;
    const intended = !item.is_save;
    setFeedItems((i) =>
      i.map((i) => (i.item_id === itemId ? { ...i, is_save: intended } : i)),
    );
    try {
      await saveItem(userId, itemId, intended, feedType);
    } catch (err) {
      console.error("Failed to toggle save:", err);
    }
  };

const handleAddSource = async () => {
  if (!newSourceUrl.trim()) return;
  setAddingSource(true);
  setAddError(null);

  try {
    if (feedType === "rss") {
      await addUserSource(userId, newSourceUrl);
    } else {
      await addUserPodcast(userId, newSourceUrl);
    }

    toast.success(
      `${feedType === "rss" ? "Feed" : "Podcast"} added successfully!`,
    );

    setNewSourceUrl("");

    const refreshedFeed = await userFeedItems(userId, feedType);
    setFeedItems(
      refreshedFeed.map((i: any) => ({
        ...i,
        is_save: Boolean(i.is_save),
      })),
    );
  } catch (err) {
    console.error(err);
    setAddError("Could not add source. Please check the URL or try again.");
    toast.error("Failed to add this source. Please try a different URL");
  } finally {
    setAddingSource(false);
  }
};


  const addWord = () => {
    const word = blockInput.trim().toLowerCase();
    if (!word) return;
    if (blocklist.includes(word)) {
      toast.error(`"${word}" is already blocked`);
      setBlockInput("");
      return;
    }

    setBlocklist((prev: string[]) => {
      const updated = [...prev, word];
      localStorage.setItem("blocklist", JSON.stringify(updated)); // persist immediately
      return updated;
    });

    setBlockInput("");
    toast.success(`Blocked "${word}"`);
  };

  const removeWord = (word: string) => {
    setBlocklist((prev: string[]) => {
      const updated = prev.filter((w) => w !== word);
      localStorage.setItem("blocklist", JSON.stringify(updated)); // persist
      return updated;
    });
    toast.info(`Removed "${word}"`);
  };


  //Filter feed with blocklist
  const filterWithBlocklist = (items: FeedItems[], blocklist: string[]) => {
    return items.filter((article) => {
      const title = (article.title || "").toLowerCase();
      const desc = (article.description || "").toLowerCase();
      return !blocklist.some(
        (word) => title.includes(word) || desc.includes(word),
      );
    });
  };

  const filteredFeedItems = filterWithBlocklist(feedItems, blocklist);

  const noFeedItems = !loading && filteredFeedItems.length === 0;

  //Group feed by source name
  const groupedFeed = filteredFeedItems.reduce(
    (acc, item) => {
      if (!acc[item.source_name]) acc[item.source_name] = [];
      acc[item.source_name].push(item);
      return acc;
    },
    {} as Record<string, FeedItems[]>,
  );

  const toggleSource = (source: string) => {
    setExpandedSources((i) => ({
      ...i,
      [source]: !i[source],
    }));
  };


  
  return (
    <div className="flex min-h-screen w-full">
      {noFeedItems ? (
        <div className="flex flex-col items-center justify-center h-[90vh] w-full">
          <img
            src="/feedImage.png"
            alt="Empty Feed"
            className="w-85 h-auto mb-6"
          />
          <p className="text-[var(--text)] text-center">
            Your feed is empty right now. Add some sources to start receiving
            articles and podcasts!
          </p>
        </div>
      ) : (
        <>
          <main className="flex-1 p-4 max-w-full overflow-x-hidden">
            <div className="flex items-center justify-between mb-6">
  <h2 className="text-xl font-bold">
    {feedType === "rss" ? "Your RSS Feed" : "Your Podcast Feed"}
  </h2>

  <div className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium">
    <span>Read today: </span>
    <span className="tabular-nums">{readCount}</span>
  </div>
</div>


            {/* Add Source */}
            <div className="flex mb-6 w-full max-w-full">
              <input
                type="search"
                placeholder="Paste website URL"
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
                className="rounded-l-md border border-secondary-border py-1 text-lg h-10 px-4 w-96 outline-none"
              />
              <Button className="flex-shrink-0 h-10 py-2 px-4 rounded-none rounded-r-md">
                <Search />
              </Button>
              <Button
                className="ml-4 h-10 py-2 px-4 rounded-md"
                disabled={addingSource}
                onClick={handleAddSource}
              >
                {addingSource
                  ? "Adding..."
                  : `Add ${feedType === "rss" ? "Feed" : "Podcast"}`}
              </Button>
            </div>
            {addError && <p className="text-red-500 mt-2">{addError}</p>}

            {/* Sources */}
            <section className="mt-10 w-full max-w-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center text-md font-semibold hover:bg-[var(--light-grey)] hover:text-[var(--accent)] focus:outline-none focus:ring-0 focus-visible:ring-0"
                      >
                        Your Sources
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="bg-white border border-gray-100"
                    >
                      <DropdownMenuItem onClick={() => setFeedType("rss")}>
                        📰 Blogs / Articles
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFeedType("podcast")}>
                        🎧 Podcasts
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/*Category Filter Dropdown */}
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
                        onClick={() => handleCategorySelect("All")}
                        className={`cursor-pointer transition-colors ${
                          selectedCategory === "All"
                            ? "bg-[var(--navyblue)] text-white"
                            : "hover:bg-[var(--light-grey)] hover:text-[var(--accent)]"
                        }`}
                      >
                        All Categories
                      </DropdownMenuItem>
                      {allCategories.map((cat) => (
                        <DropdownMenuItem
                          key={cat}
                          onClick={() => handleCategorySelect(cat)}
                          className={`cursor-pointer transition-colors ${
                            selectedCategory === cat
                              ? "bg-[var(--navyblue)] text-white"
                              : "hover:bg-[var(--light-grey)] hover:text-[var(--accent)]"
                          }`}
                        >
                          {cat}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm text-gray-500">
                  Showing:{" "}
                  <span className="font-medium text-[var(--accent)]">
                    {feedType === "rss" ? "Blogs / Articles" : "Podcasts"}
                  </span>
                </p>
              </div>

              
            </section>

            {/* Feed */}
            <section className="mt-10 w-full max-w-full">
              <div className="mb-4 flex justify-between items-center">
                <div />
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    className="text-[var(--text)] bg-[var(--light-grey)] hover:text-[var(--sidebar-active-foreground)] hover:bg-[var(--navyblue)]"
                    onClick={handleMarkAsReadFeed}
                  >
                    Mark all as read
                  </Button>

                  {/* Blocklist Modal */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="text-[var(--text)] bg-[var(--light-grey)] hover:text-[var(--sidebar-active-foreground)] hover:bg-[var(--navyblue)]">
                        Blocked Words
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md bg-white text-black">
                      <DialogHeader>
                        <DialogTitle>Blocked Words</DialogTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          Items containing these words will be hidden.
                        </p>
                      </DialogHeader>
                      <div className="flex gap-2 mt-3">
                        <input
                          type="text"
                          value={blockInput}
                          onChange={(e) => setBlockInput(e.target.value)}
                          placeholder="Enter word or phrase"
                          onKeyDown={(e) => e.key === "Enter" && addWord()}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-gray-500"
                        />
                        <Button onClick={addWord}>Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {blocklist.length > 0 ? (
                          blocklist.map((word) => (
                            <div
                              key={word}
                              className="flex items-center bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                            >
                              {word}
                              <X
                                onClick={() => removeWord(word)}
                                className="ml-2 h-3 w-3 cursor-pointer hover:text-red-500"
                              />
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-400">
                            No blocked words yet.
                          </p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              {loading ? (
                <p className="text-gray-500">Loading feed...</p>
              ) : filteredFeedItems.length === 0 ? (
                <div className="w-full text-center py-10 text-gray-400">
                  No items yet.
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-gray-300">
                  {Object.entries(groupedFeed).map(([source, items]) => {
                    const isExpanded = expandedSources[source];
                    const visibleItems = isExpanded
                      ? items
                      : items.slice(0, 15);
                    return (
                      <div key={source} className="mb-8">
                        <h4 className="text-lg font-semibold mb-3">{source}</h4>
                        <div className="flex flex-col divide-y divide-gray-300 w-full max-w-full">
                          {visibleItems.map((item) => (
                            <div
                              key={item.item_id}
                              className="py-6 flex divide-gray-300 items-start hover:bg-[var(--hover)] transition"
                            >
                              <div className="flex-1 pr-4">
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {item.categories?.map((cat) => {
                                    const {
                                      className: backendClasses,
                                      style: backendStyle,
                                    } = getCategoryPresentation(
                                      cat.color,
                                      cat.name,
                                    );
                                    return (
                                      <span
                                        key={cat.name}
                                        className={`text-[12px] px-2 py-0. rounded-full ${backendClasses}`}
                                        style={backendStyle}
                                      >
                                        {cat.name}
                                      </span>
                                    );
                                  })}
                                </div>
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
                                  <p className="text-sm mt-1 line-clamp-3 text-[var(--text)]">
                                    {item.description}
                                  </p>
                                )}
                                {item.pub_date && (
                                  <p className="text-xs text-gray-500 mt-4">
                                    {new Date(
                                      item.pub_date,
                                    ).toLocaleDateString()}
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
                          {items.length > 15 && (
                            <div className="flex justify-center mt-4 mb-4">
                              <Button
                                variant="ghost"
                                className="text-[var(--accent)] hover:text-[var(--navyblue)]"
                                onClick={() => toggleSource(source)}
                              >
                                {isExpanded
                                  ? "Show less"
                                  : `Show ${items.length - 15} more`}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </main>
        </>
      )}
    </div>
  );
}
