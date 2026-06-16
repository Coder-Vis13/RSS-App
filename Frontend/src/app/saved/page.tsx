import { useState, useEffect, useMemo } from "react";

import {
  allSavedItems,
  markItemRead,
  getSavedItemsByCategory,
} from "../../services/user.service";
import { getCategoryPresentation } from "../../lib/categoryColors";
import AppHeader from "@/components/layout/AppHeader";

interface SavedItems {
  item_id: number;
  title: string;
  link: string;
  description: string;
  pub_date: string;
  source_name: string;
  categories?: { name: string; color: string }[];
  tags?: string[];
  feed_type: "rss" | "podcast";
}

export default function SavedPage() {
  const [savedItems, setSavedItems] = useState<SavedItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState<"rss" | "podcast">("rss");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [allCategories, setAllCategories] = useState<string[]>([]);
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

  const userId = 1;

  // Fetch saved items
  useEffect(() => {
    if (!userId) return;

    const fetchSavedItems = async () => {
      setLoading(true);
      try {
        let data;

        if (selectedCategory === "All") {
          data = await allSavedItems(userId, selectedTime);
        } else {
          data = await getSavedItemsByCategory(
            userId,
            selectedCategory,
            selectedTime,
          );
        }

        setSavedItems(data);

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
        console.error("Failed to load saved items:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedItems();
  }, [userId, selectedCategory, selectedTime]);

  useEffect(() => {
    setSelectedCategory("All");
  }, [feedType]);

  const handleMarkAsReadSaved = async (itemId: number) => {
    try {
      await markItemRead(userId, itemId);
      setSavedItems((prev) => prev.filter((item) => item.item_id !== itemId));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  // const handleCategorySelect = async (category: string) => {
  //   setSelectedCategory(category);
  //   setLoading(true);
  //   try {
  //     if (category === "All") {
  //       const allItems = await allSavedItems(userId);
  //       setSavedItems(allItems);
  //     } else {
  //       const filtered = await getSavedItemsByCategory(userId, category);
  //       setSavedItems(filtered);
  //     }
  //   } catch (err) {
  //     console.error("Failed to fetch saved items by category:", err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const filteredSavedItems = useMemo(() => {
    return savedItems.filter((i) => i.feed_type === feedType);
  }, [savedItems, feedType]);

  const handleMarkAllReadSaved = async () => {
    try {
      for (const item of filteredSavedItems) {
        await markItemRead(userId, item.item_id);
      }
      const markedIds = new Set(filteredSavedItems.map((item) => item.item_id));
      setSavedItems((prev) =>
        prev.filter((item) => !markedIds.has(item.item_id)),
      );
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const noSavedItems = !loading && savedItems.length === 0;

  return (
    <div>
      {/* Empty state banner */}
      {noSavedItems ? (
        <div className="flex flex-col items-center justify-center w-full py-24">
          <img
            src="/savedImage.png"
            alt="Empty Saved Items"
            className="w-80 h-auto mb-6"
          />
          <p className="text-[var(--text)] text-center">
            Found something worth keeping? Save it to build your personal
            library right here
          </p>
        </div>
      ) : (
        <>
          {/* Header */}
          <AppHeader
            feedType={feedType}
            setFeedType={setFeedType}
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
            categories={allCategories}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            onMarkAllRead={handleMarkAllReadSaved}
          />
          <div className="px-6">
            <section className="max-w-[1100px] mx-auto">
              {/* Saved items */}
              {loading ? (
                <p className="text-[var(--text-light)]">
                  Loading saved items...
                </p>
              ) : (
                <div className="flex flex-col divide-y divide-gray-300 w-full max-w-full">
                  {filteredSavedItems.map((item) => (
                    <div
                      key={item.item_id}
                      className="py-6 flex items-start hover:bg-[var(--hover)] transition w-full max-w-full"
                    >
                      <div className="flex-1 pr-4">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {item.categories?.map((cat) => {
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
                          onClick={() => handleMarkAsReadSaved(item.item_id)}
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
                          <p className="text-xs text-[var(--text-light)] mt-4">
                            {item.source_name} •{" "}
                            {new Date(item.pub_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
