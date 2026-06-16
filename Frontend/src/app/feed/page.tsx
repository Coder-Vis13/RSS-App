//container - all logic, owns its own data

import { useState, useEffect, useMemo } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "../../components/ui/button";
// import { readItems } from "../../services/user.service";

import {
  userFeedItems,
  markItemRead,
  saveItem,
  markUserFeedItemsRead,
  getItemsByCategory,
} from "../../services/user.service";

import AppHeader from "@/components/layout/AppHeader";
import { useBlocklist } from "@/context/blocklistContext";

import { getCategoryPresentation } from "../../lib/categoryColors";
import { getAuthUserId } from "@/auth";

interface FeedItems {
  item_id: number;
  title: string;
  link: string;
  description: string;
  pub_date: string;
  source_name: string;
  is_save: boolean;
  feed_type: "rss" | "podcast";
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

    const userId = getAuthUserId();
    if (!userId) {
    return null;
  }

  const { blocklist } = useBlocklist();


  //Fetch feed
  useEffect(() => {
    if (!userId) return;

    const fetchFeed = async () => {
      if (feedItems.length === 0) setLoading(true);
      try {
        let data;

        if (selectedCategory === "All") {
          data = await userFeedItems(userId, selectedTime);
        } else {
          data = await getItemsByCategory(
            userId,
            selectedCategory,
            selectedTime,
          );
        }
        const normalized = data.map((i: any) => ({
          ...i,
          is_save: Boolean(i.is_save),
        }));
        setFeedItems(normalized);
        console.log("RAW FEED", normalized);

        const uniqueCategories: string[] = Array.from(
          new Set(
            normalized.flatMap((i: any) =>
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
  }, [userId, selectedTime, selectedCategory]);

  useEffect(() => {
    setSelectedCategory("All");
  }, [feedType]);

  const handleMarkAsRead = async (itemId: number) => {
    try {
      await markItemRead(userId, itemId);
      setFeedItems((i) => i.filter((item) => item.item_id !== itemId));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAsReadFeed = async () => {
    try {
      await markUserFeedItemsRead(userId);
      let updatedFeed;

      if (selectedCategory === "All") {
        updatedFeed = await userFeedItems(userId, selectedTime);
      } else {
        updatedFeed = await getItemsByCategory(
          userId,
          selectedCategory,
          selectedTime,
        );
      }
      const normalized = updatedFeed.map((i: any) => ({
        ...i,
        is_save: Boolean(i.is_save),
      }));
      setFeedItems(normalized);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSave = async (itemId: number) => {
    const item = feedItems.find((i) => i.item_id === itemId);
    if (!item) return;
    const intended = !item.is_save;
    setFeedItems((i) =>
      i.map((i) => (i.item_id === itemId ? { ...i, is_save: intended } : i)),
    );
    try {
      await saveItem(userId, itemId, intended);
    } catch (err) {
      console.error("Failed to toggle save:", err);
    }
  };

  const filterWithBlocklist = (items: FeedItems[], blocklist: string[]) => {
    return items.filter((article) => {
      const title = (article.title || "").toLowerCase();
      const desc = (article.description || "").toLowerCase();
      return !blocklist.some(
        (word) => title.includes(word) || desc.includes(word),
      );
    });
  };

  const filteredFeedItems = useMemo(() => {
  return filterWithBlocklist(
    feedItems.filter((i) => i.feed_type === feedType),
    blocklist,
  ).sort((a, b) => b.pub_date.localeCompare(a.pub_date));
}, [feedItems, feedType, blocklist]);

  const noFeedItems = !loading && feedItems.length === 0;


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
          <main className="flex-1 w-full">
            <AppHeader
              feedType={feedType}
              setFeedType={setFeedType}
              selectedCategory={selectedCategory}
              onCategorySelect={handleCategorySelect}
              categories={allCategories}
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
              onMarkAllRead={handleMarkAsReadFeed}
            />

            {/* <Separator className="bg-[#b0b0b0] mt-4" /> */}

            {/* Feed */}
            <div className="px-6">
              <section className=" max-w-[1100px] mx-auto">
                {loading ? (
                  <p className="text-gray-500">Loading feed...</p>
                ) : filteredFeedItems.length === 0 ? (
                  <div className="w-full text-center py-10 text-gray-400">
                    No items yet.
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-gray-300">
  {filteredFeedItems.map((item) => (
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

        <p className="text-xs text-gray-500 mt-4">
          {item.source_name} •{" "}
          {new Date(item.pub_date).toLocaleDateString()}
        </p>
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
                )}
              </section>
            </div>
          </main>
        </>
      )}
    </div>
  );
}
