import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Bookmark } from "lucide-react";

import {
  markItemRead,
  saveItem,
  markSourceItemsRead,
} from "../services/user.service";
import { getSourceItems } from "../services/user.service";

import { usePolling } from "@/hooks/usePolling";
import { useCategorizationPolling } from "@/hooks/useCategorizationPolling";

import { Button } from "@/components/ui/button";
import { getCategoryPresentation } from "../lib/categoryColors";

import AppHeader from "@/components/layout/AppHeader";
import { useBlocklist } from "@/context/blocklistContext";
import { getAuthUserId } from "@/auth";

interface SourceItem {
  item_id: number;
  title: string;
  link: string;
  description: string;
  pub_date: string | Date;
  source_name: string;
  source_id: number;
  is_save: boolean;
  categories?: { name: string; color: string }[];
  tags?: string[];
  feed_type: "rss" | "podcast";
  is_categorized?: boolean;
}

export default function SourcePage() {
  const { sourceId } = useParams<{ sourceId: string }>();
  const location = useLocation();

  const userId = getAuthUserId();
  if (!userId) {
    return null;
  }

  const [items, setItems] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  const [feedType, setFeedType] = useState<"rss" | "podcast">("rss");
  const [selectedTime, setSelectedTime] = useState<
    "all" | "today" | "week" | "month"
  >(() => {
    const stored = sessionStorage.getItem("activeTimeFilter");
    if (
      stored === "today" ||
      stored === "week" ||
      stored === "month" ||
      stored === "all"
    ) {
      return stored;
    }
    return "all";
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    const fromNav = (location.state as { feedType?: "rss" | "podcast" } | null)
      ?.feedType;

    if (fromNav === "rss" || fromNav === "podcast") {
      sessionStorage.setItem("activeFeedType", fromNav);
      setFeedType(fromNav);
    }
  }, [sourceId, location.state]);

  const { blocklist } = useBlocklist();

  const fetchSourceItems = useCallback(
    async (showLoading = true) => {
      if (!sourceId) return;

      if (showLoading) {
        setLoading(true);
      }

      try {
        const data = await getSourceItems(
          userId,
          Number(sourceId),
          selectedTime,
        );

        const normalized: SourceItem[] = data.map((i: any) => ({
          ...i,
          is_save: Boolean(i.is_save),
        }));

        setItems(normalized);

        if (
          normalized[0]?.feed_type === "rss" ||
          normalized[0]?.feed_type === "podcast"
        ) {
          sessionStorage.setItem("activeFeedType", normalized[0].feed_type);
          setFeedType(normalized[0].feed_type);
        }

        const allCats = normalized.flatMap(
          (i) => i.categories?.map((c) => c.name) ?? [],
        );

        setUniqueCategories(Array.from(new Set(allCats)));

        return normalized;
      } catch (err) {
        console.error("Failed to load source items:", err);
      } finally {
        setLoading(false);
      }
    },
    [userId, sourceId, selectedTime],
  );

  useEffect(() => {
    fetchSourceItems();
  }, [fetchSourceItems]);

  const hasPendingCategories = useMemo(
    () => items.some((item) => item.is_categorized === false),
    [items],
  );

  usePolling(
    () => {
      fetchSourceItems(false);
    },
    !!userId && !!sourceId,
    300000,
  );

  useCategorizationPolling(fetchSourceItems, hasPendingCategories);

  useEffect(() => {
    setSelectedCategory("All");
  }, [feedType]);

  const filterWithBlocklist = (items: SourceItem[], blocklist: string[]) =>
    items.filter((item) => {
      const t = (item.title || "").toLowerCase();
      const d = (item.description || "").toLowerCase();
      return !blocklist.some((w) => t.includes(w) || d.includes(w));
    });

  const handleMarkAsRead = async (itemId: number) => {
    await markItemRead(userId, itemId);
    setItems((prev) => prev.filter((i) => i.item_id !== itemId));
  };

  const handleMarkSourceRead = async () => {
    if (!sourceId) return;
    await markSourceItemsRead(userId, Number(sourceId));
    await fetchSourceItems();
  };

  const handleSave = async (itemId: number) => {
    const item = items.find((i) => i.item_id === itemId);
    if (!item) return;

    const intended = !item.is_save;

    setItems((prev) =>
      prev.map((i) => (i.item_id === itemId ? { ...i, is_save: intended } : i)),
    );

    try {
      await saveItem(userId, itemId, intended);
    } catch {
      setItems((prev) =>
        prev.map((i) =>
          i.item_id === itemId ? { ...i, is_save: !intended } : i,
        ),
      );
    }
  };

  const filteredItems = filterWithBlocklist(items, blocklist)
    .filter((i) => i.feed_type === feedType)
    .filter(
      (i) =>
        selectedCategory === "All" ||
        i.categories?.some((c) => c.name === selectedCategory),
    );

  if (loading) return <p>Loading...</p>;

  return (
    <div className="flex min-h-screen w-full">
      <main className="flex-1 w-full">
        <AppHeader
          feedType={feedType}
          setFeedType={setFeedType}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          categories={uniqueCategories}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
          onMarkAllRead={handleMarkSourceRead}
        />

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[80vh] text-center">
            <p className="text-lg font-semibold">No unread items</p>
            <p className="text-sm text-[var(--text-light)] mt-2">
              You are all caught up for this source.
            </p>
          </div>
        ) : (
          <>
            {/* items */}
            <div className="px-6">
              <section className="max-w-[1100px] mx-auto">
                <div className="flex flex-col divide-y divide-gray-300">
                  {filteredItems.length === 0 ? (
                    <div className="w-full text-center py-10 text-gray-400">
                      No {feedType === "rss" ? "articles" : "podcasts"} found.
                    </div>
                  ) : (
                    filteredItems.map((item) => (
                      <div
                        key={item.item_id}
                        className="py-6 flex justify-between items-center hover:bg-[var(--hover)]"
                      >
                        <div className="flex-1 pr-4">
                          {item.categories && item.categories.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {item.categories.map((cat) => {
                                const p = getCategoryPresentation(cat.name);
                                return (
                                  <span
                                    key={cat.name}
                                    className={`text-[12px] px-2 py-0.5 rounded-full ${p.className}`}
                                    style={p.style}
                                  >
                                    {cat.name}
                                  </span>
                                );
                              })}
                            </div>
                          )}
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
                            className="text-[var(--accent)] font-medium hover:underline"
                          >
                            {item.title}
                          </a>

                          {item.description && (
                            <p className="text-sm mt-1 line-clamp-3 text-[var(--text)]">
                              {item.description}
                            </p>
                          )}

                          <p className="text-xs mt-4 text-[var(--text-light)]">
                            {new Date(item.pub_date).toLocaleDateString()}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          className="ml-4 shrink-0 h-12 w-12 p-0"
                          onClick={() => handleSave(item.item_id)}
                        >
                          <Bookmark
                            size={20}
                            className={
                              item.is_save
                                ? "text-[var(--accent)] fill-[var(--accent)]"
                                : "text-gray-400"
                            }
                          />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
