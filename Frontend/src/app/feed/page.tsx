import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { readItems } from "../../services/user.service";


import {
  userFeedItems,
  markItemRead,
  saveItem,
  markUserFeedItemsRead,
  getItemsByCategory,
} from "../../services/user.service";

import { getCategoryPresentation } from "../../lib/categoryColors";
import AppHeader from "../../components/layout/AppHeader";


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
  tags?: string[];
}

export default function FeedPage() {
  const [feedItems, setFeedItems] = useState<FeedItems[]>([]);
  // const [sources, setSources] = useState<UserSources[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState<"rss" | "podcast">("rss");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [readCount, setReadCount] = useState(0);
  const [selectedTime, setSelectedTime] = useState<'all' | 'today' | 'week' | 'month'>('all');


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
        const data = await userFeedItems(userId, feedType, selectedTime);
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
  }, [userId, feedType, selectedTime]);

  //Blocklist
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
      const updatedFeed = await userFeedItems(userId, feedType, selectedTime);
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
          <main className="flex-1 max-w-full">
          
            <AppHeader
  title="Feed"
  readCount={readCount}
  feedType={feedType}
  onFeedTypeChange={setFeedType}
  categories={allCategories}
  selectedCategory={selectedCategory}
  onCategoryChange={handleCategorySelect}
  selectedTime={selectedTime}
  onTimeChange={setSelectedTime}
  onMarkAllRead={handleMarkAsReadFeed}
  onOpenBlocklist={() => {
    // open your dialog here
  }}
/>


            {/* Feed */}
            <section className="mt-8 w-full max-w-full">
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
                      <div key={source} className="mb-4 mt-8">
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
                                {item.tags && item.tags.length > 0 && (
  <div className="flex flex-wrap gap-2 mt-1 mb-4">
    {item.tags.map((tag) => (
      <span
        key={tag}
        className="text-[12px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-800"
      >
        {tag}
      </span>
    ))}
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
