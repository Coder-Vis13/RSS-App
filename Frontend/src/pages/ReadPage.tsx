import { useState, useEffect } from "react";
import { readItems } from "../services/user.service";
import { useLocation } from "react-router-dom";
import { getCategoryPresentation } from "../lib/categoryColors";
import AppHeader from "@/components/layout/AppHeader";
import { useMemo } from "react";
import { getAuthUserId } from "@/auth";

interface ReadItems {
  item_id: number;
  title: string;
  link: string;
  description: string;
  pub_date: string;
  source_name: string;
  read_time: string;
  categories?: { name: string; color: string }[];
  tags?: string[];
  feed_type: "rss" | "podcast";
}

export default function ReadPage() {
  const [allReadItems, setAllReadItems] = useState<ReadItems[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [allCategories, setAllCategories] = useState<string[]>([]);

  const location = useLocation();
  const userId = getAuthUserId();
  if (!userId) {
    return null;
  }

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try {
        const data = await readItems(userId, selectedTime);
        const sortedData = [...data].sort(
          (a: any, b: any) =>
            new Date(b.read_time).getTime() - new Date(a.read_time).getTime(),
        );

        setAllReadItems(sortedData);
        const uniqueCategories: string[] = Array.from(
          new Set(
            data.flatMap((i: any) =>
              (i.categories || []).map((c: any) =>
                c?.name ? c.name : "Uncategorized",
              ),
            ),
          ),
        );

        setAllCategories(uniqueCategories);
      } catch (err) {
        console.error("Failed to load read items:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [userId, selectedTime, location.pathname]);

  useEffect(() => {
    setSelectedCategory("All");
  }, [feedType]);

  const filteredReadItems = useMemo(() => {
    return allReadItems
      .filter((i) => i.feed_type === feedType)
      .filter(
        (i) =>
          selectedCategory === "All" ||
          i.categories?.some((c) => c.name === selectedCategory),
      )
      .sort((a, b) => {
        return (
          new Date(b.read_time).getTime() - new Date(a.read_time).getTime()
        );
      });
  }, [allReadItems, feedType, selectedCategory]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const hasAnyData = allReadItems.length > 0;
  const hasVisibleItems = filteredReadItems.length > 0;

  const showBackendEmptyState = !loading && !hasAnyData;
  const showFilteredEmptyState = !loading && hasAnyData && !hasVisibleItems;

  return (
    <div>
      {/*Empty State Banner*/}
      {loading ? (
        <p className="text-[var(--text-light)]">Loading read items...</p>
      ) : showBackendEmptyState ? (
        <div className="flex flex-col items-center justify-center w-full h-[90vh]">
          <img
            src="/readImage.png"
            alt="Nothing Read Yet"
            className="w-80 h-auto mb-6"
          />
          <p className="text-[var(--text)] text-center">
            You haven’t read anything yet. Start exploring and your history will
            appear here.
          </p>
        </div>
      ) : (
        <>
          {/*Header*/}
          <AppHeader
            feedType={feedType}
            setFeedType={setFeedType}
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
            categories={allCategories}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            onMarkAllRead={undefined}
            showMarkAllRead={false}
          />
          <div className="px-6">
            <section className="w-full max-w-[1100px] mx-auto">
              {showFilteredEmptyState ? (
                <div className="flex flex-col items-center justify-center w-full h-[70vh]">
                  <p className="text-[var(--text)] text-center">
                    No {feedType === "rss" ? "articles" : "podcasts"} match your
                    current filters.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-gray-300 w-full max-w-full">
                  {filteredReadItems.map((item) => (
                    <div
                      key={item.item_id}
                      className="py-6 flex items-start hover:bg-[var(--hover)] transition w-full max-w-full"
                    >
                      <div className="flex-1 pr-4">
                        {/* Categories */}
                        {item.categories && item.categories.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {item.categories.map((cat) => {
                              const { className, style } =
                                getCategoryPresentation(cat.name);

                              return (
                                <span
                                  key={cat.name}
                                  className={`text-[12px] px-2 py-0.5 rounded-full ${className}`}
                                  style={style}
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
                        {/* Title */}
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--accent)] hover:underline font-semibold"
                        >
                          {item.title}
                        </a>

                        {/* Description */}
                        {item.description && (
                          <p className="text-[var(--text)] text-sm mt-1 line-clamp-3">
                            {item.description}
                          </p>
                        )}

                        {/* Meta */}
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
