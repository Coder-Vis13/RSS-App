import { useState, useEffect } from "react";
import { toast } from "sonner";
import { readItems } from "@/services/user.service";

export function useAppHeader(userId: number) {
  const [feedType, setFeedType] = useState<"rss" | "podcast">("rss");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [readCount, setReadCount] = useState(0);
  const [selectedTime, setSelectedTime] = useState<
    "all" | "today" | "week" | "month"
  >("all");

  const [blockInput, setBlockInput] = useState("");
  const [blocklist, setBlocklist] = useState<string[]>(() => {
    const stored = localStorage.getItem("blocklist");
    return stored ? JSON.parse(stored) : [];
  });

  // Persist blocklist
  useEffect(() => {
    localStorage.setItem("blocklist", JSON.stringify(blocklist));
  }, [blocklist]);

  // Read count polling (ONLY depends on userId)
  useEffect(() => {
    let cancelled = false;

    const fetchReadCount = async () => {
      const items = await readItems(userId);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayCount = items.filter((item: any) => {
        if (!item.read_time) return false;
        const d = new Date(item.read_time);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      }).length;

      if (!cancelled) setReadCount(todayCount);
    };

    fetchReadCount();
    const interval = setInterval(fetchReadCount, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userId]);

  const addWord = () => {
    const word = blockInput.trim().toLowerCase();
    if (!word) return;

    if (blocklist.includes(word)) {
      toast.error(`"${word}" already blocked`);
      return;
    }

    setBlocklist((prev) => [...prev, word]);
    setBlockInput("");
    toast.success(`Blocked "${word}"`);
  };

  const removeWord = (word: string) => {
    setBlocklist((prev) => prev.filter((w) => w !== word));
    toast.info(`Removed "${word}"`);
  };

  return {
    feedType,
    setFeedType,
    selectedCategory,
    setSelectedCategory,
    allCategories,
    setAllCategories,
    readCount,
    selectedTime,
    setSelectedTime,
    blockInput,
    setBlockInput,
    blocklist,
    addWord,
    removeWord,
  };
}
