//A shared top bar on feed-like pages containing feed-type switcher, category filter, time filter, mark-all-read button, and blocklist management UI.
//presentational - UI

import {
  ChevronDown,
  CheckCheck,
  Ban,
  X,
  Menu,
  SlidersHorizontal,
} from "lucide-react";
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
  DialogClose,
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
import { useSidebar } from "@/components/sidebar/sidebarContext";

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
  filtersDisabled?: boolean;
  timeFilterDisabled?: boolean;
  markAllReadDisabled?: boolean;
}

export default function AppHeader(props: AppHeaderProps) {
  const [blockInput, setBlockInput] = useState("");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const timeFilterDisabled =
    props.timeFilterDisabled ?? props.filtersDisabled;

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
      <div className="flex items-center justify-between gap-2 px-2 py-2 sm:px-4 sm:py-3">
        <div className="flex min-w-0 items-center gap-1 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={sidebarOpen}
            aria-controls="app-sidebar"
            onClick={() => setSidebarOpen((open) => !open)}
            className="h-9 w-9 shrink-0 lg:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {props.feedType && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex min-w-0 items-center gap-1 whitespace-nowrap text-base font-semibold hover:text-[var(--accent)] focus:outline-none focus:ring-0 focus-visible:ring-0 sm:gap-1.5 sm:text-xl">
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
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
          {/*Category Filter Dropdown */}
          <div className="hidden items-center gap-1 lg:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  disabled={props.filtersDisabled}
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
                  disabled={timeFilterDisabled}
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
          </div>
          <TooltipProvider delayDuration={150}>
            <div className="flex items-center gap-0.5 sm:gap-1">
              {/* Mark all as read */}
              {props.showMarkAllRead !== false && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={props.markAllReadDisabled}
                      onClick={() => {
                        if (!props.markAllReadDisabled) props.onMarkAllRead?.();
                      }}
                      className="h-8 w-8 shrink-0 hover:text-[var(--text)] hover:bg-[var(--light-grey)] sm:h-9 sm:w-9"
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
                        className="h-8 w-8 shrink-0 hover:text-[var(--text)] hover:bg-[var(--light-grey)] sm:h-9 sm:w-9"
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

              {/* Mobile filters bottom sheet */}
              <Dialog open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Open filters"
                        disabled={timeFilterDisabled}
                        className="h-8 w-8 shrink-0 hover:bg-[var(--light-grey)] sm:h-9 sm:w-9 lg:hidden"
                      >
                        <SlidersHorizontal className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Filters</TooltipContent>
                </Tooltip>

                <DialogContent className="max-h-[85dvh] overflow-y-auto bg-white p-5 pb-8 text-black max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:left-0 max-lg:top-auto max-lg:w-full max-lg:max-w-none max-lg:translate-x-0 max-lg:translate-y-0 max-lg:rounded-b-none max-lg:rounded-t-3xl lg:hidden">
                  <DialogHeader>
                    <DialogTitle>Filters</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label
                        htmlFor="mobile-category-filter"
                        className="text-sm font-medium text-[var(--navyblue)]"
                      >
                        Category
                      </label>
                      <select
                        id="mobile-category-filter"
                        disabled={props.filtersDisabled}
                        value={props.selectedCategory}
                        onChange={(event) => props.onCategorySelect(event.target.value)}
                        className="w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm text-[var(--navyblue)] outline-none focus:border-[var(--navyblue)]"
                      >
                        <option value="All">All Categories</option>
                        {props.categories?.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="mobile-time-filter"
                        className="text-sm font-medium text-[var(--navyblue)]"
                      >
                        Time
                      </label>
                      <select
                        id="mobile-time-filter"
                        disabled={timeFilterDisabled}
                        value={props.selectedTime}
                        onChange={(event) =>
                          switchSelectedTime(event.target.value as AppHeaderProps["selectedTime"])
                        }
                        className="w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm text-[var(--navyblue)] outline-none focus:border-[var(--navyblue)]"
                      >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">Week</option>
                        <option value="month">Month</option>
                      </select>
                    </div>
                  </div>

                  <DialogClose asChild>
                    <Button className="w-full rounded-xl">Done</Button>
                  </DialogClose>
                </DialogContent>
              </Dialog>
            </div>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
