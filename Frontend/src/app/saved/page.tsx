import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  allSavedItems,
  markItemRead,
  getSavedItemsByCategory,
} from "../../services/user.service";
import { getCategoryPresentation } from "../../lib/categoryColors";

interface SavedItems {
  item_id: number;
  title: string;
  link: string;
  description: string;
  pub_date: string | Date;
  source_name: string;
  categories?: { name: string; color: string }[];
  tags?: string[];
}

export default function SavedPage() {
  const [savedItems, setSavedItems] = useState<SavedItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState<"rss" | "podcast">("rss");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [allCategories, setAllCategories] = useState<string[]>([]);

  const userId = 1;

  const noSavedItems = !loading && savedItems.length === 0;

  // Fetch saved items
  useEffect(() => {
    const fetchSavedItems = async () => {
      setLoading(true);
      try {
        const data = await allSavedItems(userId, feedType);
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
  }, [userId, feedType]);

  const handleMarkAsRead = async (itemId: number) => {
    try {
      await markItemRead(userId, itemId, feedType);
      setSavedItems((prev) => prev.filter((item) => item.item_id !== itemId));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleCategorySelect = async (category: string) => {
    setSelectedCategory(category);
    setLoading(true);
    try {
      if (category === "All") {
        const allItems = await allSavedItems(userId, feedType);
        setSavedItems(allItems);
      } else {
        const filtered = await getSavedItemsByCategory(
          userId,
          category,
          feedType,
        );
        setSavedItems(filtered);
      }
    } catch (err) {
      console.error("Failed to fetch saved items by category:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
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
        <section className="mt-0">
          {/* Header */}
          <div className="flex items-center justify-between w-full mb-8">
            <div className="flex items-center gap-3">
              {/* Feed type dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 text-md hover:bg-transparent hover:text-[var(--accent)] focus:outline-none focus:ring-0 focus-visible:ring-0"
                  >
                    Saved Items ({savedItems.length})
                    <ChevronDown className="h-5 w-5" />
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

              {/* Category dropdown */}
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

          {/* Saved items */}
          {loading ? (
            <p className="text-[var(--text-light)]">Loading saved items...</p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-300 w-full max-w-full">
              {savedItems.map((item) => (
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
      )}
    </div>
  );
}
