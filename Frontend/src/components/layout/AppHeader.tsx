//A shared top bar on feed-like pages containing feed-type switcher, category filter, time filter, mark-all-read button, and blocklist management UI.
//presentational - UI

import { ChevronDown, CheckCheck, Ban, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useBlocklist } from "@/context/blocklistContext";

interface AppHeaderProps {
  title?: string;
  feedType: "rss" | "podcast";
  setFeedType: (type: "rss" | "podcast") => void;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  categories?: string[];
  selectedTime: "all" | "today" | "week" | "month";
  setSelectedTime: (time: "all" | "today" | "week" | "month") => void;
  onMarkAllRead?: () => void;
  showBlocklist?: boolean;
  showMarkAllRead?: boolean;
}

export default function AppHeader(props: AppHeaderProps) {
  const [blockInput, setBlockInput] = useState("");

  const {
    blocklist,
    addWord: addBlockedWord,
    removeWord: removeBlockedWord,
  } = useBlocklist();

  const addWord = () => {
    const word = blockInput.trim().toLowerCase();
    if (!word) return;
    if (blocklist.includes(word)) {
      toast.error(`"${word}" is already blocked`);
      setBlockInput("");
      return;
    }

    addBlockedWord(word);

    setBlockInput("");
    toast.success(`Blocked "${word}"`);
  };

  const removeWord = (word: string) => {
    removeBlockedWord(word);
    toast.info(`Removed "${word}"`);
  };

  // Hydrate header from last known type (set on add-source or source click)
  useEffect(() => {
    const stored = sessionStorage.getItem("activeFeedType");
    if (stored === "rss" || stored === "podcast") {
      props.setFeedType(stored);
    }
  }, [props.setFeedType]);

  const switchFeedType = (type: "rss" | "podcast") => {
    sessionStorage.setItem("activeFeedType", type);
    props.setFeedType(type);
  };

  const switchSelectedTime = (time: "all" | "today" | "week" | "month") => {
    sessionStorage.setItem("activeTimeFilter", time);
    props.setSelectedTime(time);
  };

  return (
    <div className="sticky top-0 z-10 bg-white  shadow-[0_4px_10px_rgba(0,0,0,0.06)]">
      <div className="flex justify-between mb-4 px-4 py-3">
        {/* HEADING */}

        {props.feedType && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 text-xl font-semibold hover:text-[var(--accent)] focus:outline-none focus:ring-0 focus-visible:ring-0">
                {props.feedType === "rss" ? "Blogs & Articles" : "Podcasts"}
                <ChevronDown className="h-5 w-5 opacity-60" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              className="bg-white border border-gray-100"
            >
              <DropdownMenuItem
                onClick={() => switchFeedType("rss")}
                className={
                  props.feedType === "rss"
                    ? "bg-[var(--light-grey)] font-medium text-[var(--accent)]"
                    : ""
                }
              >
                📰 Blogs & Articles
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => switchFeedType("podcast")}
                className={
                  props.feedType === "podcast"
                    ? "bg-[var(--light-grey)] font-medium text-[var(--accent)]"
                    : ""
                }
              >
                🎧 Podcasts
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="flex items-center gap-3">
          {/*Category Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center text-md hover:bg-[var(--light-grey)] hover:text-[var(--accent)] focus:outline-none focus:ring-0 focus-visible:ring-0"
              >
                Category
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="bg-white border border-gray-100"
            >
              <DropdownMenuItem
                onClick={() => props.onCategorySelect("All")}
                className={`cursor-pointer transition-colors ${
                  props.selectedCategory === "All"
                    ? "bg-[var(--navyblue)] text-white"
                    : "hover:bg-[var(--light-grey)] hover:text-[var(--accent)]"
                }`}
              >
                All Categories
              </DropdownMenuItem>
              {props.categories?.map((cat) => (
                <DropdownMenuItem
                  key={cat}
                  onClick={() => props.onCategorySelect(cat)}
                  className={`cursor-pointer transition-colors ${
                    props.selectedCategory === cat
                      ? "bg-[var(--light-grey)] text-[var(--accent)]"
                      : "hover:bg-[var(--light-grey)] hover:text-[var(--accent)]"
                  }`}
                >
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Time Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center text-md hover:bg-[var(--light-grey)] hover:text-[var(--accent)] focus:outline-none focus:ring-0 focus-visible:ring-0"
              >
                {props.selectedTime === "all"
                  ? "All Time"
                  : props.selectedTime.charAt(0).toUpperCase() +
                    props.selectedTime.slice(1)}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              className="bg-white border border-gray-100"
            >
              {(["all", "today", "week", "month"] as const).map((time) => (
                <DropdownMenuItem
                  key={time}
                  onClick={() => switchSelectedTime(time)}
                  className={`cursor-pointer transition-colors ${
                    props.selectedTime === time
                      ? "bg-[var(--light-grey)] text-[var(--accent)]"
                      : "hover:bg-[var(--light-grey)] hover:text-[var(--accent)]"
                  }`}
                >
                  {time === "all"
                    ? "All Time"
                    : time.charAt(0).toUpperCase() + time.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <TooltipProvider delayDuration={150}>
            <div className="flex items-center gap-2">
              {/* Mark all as read */}
              {props.showMarkAllRead !== false && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={props.onMarkAllRead}
                      className="hover:text-[var(--text)] hover:bg-[var(--light-grey)]"
                    >
                      <CheckCheck className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>

                  <TooltipContent
                    side="bottom"
                    sideOffset={8}
                    align="start"
                    className="bg-gray-100/95 text-gray-700 px-3 py-1.5 rounded-md text-xs backdrop-blur"
                  >
                    Mark all as read
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Blocklist Modal */}
              <Dialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-[var(--text)] hover:bg-[var(--light-grey)]"
                      >
                        <Ban className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    sideOffset={8}
                    align="start"
                    className="bg-gray-100/95 text-gray-700 px-3 py-1.5 rounded-md text-xs backdrop-blur"
                  >
                    Blocked words
                  </TooltipContent>
                </Tooltip>

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
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
