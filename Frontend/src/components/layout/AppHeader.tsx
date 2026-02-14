import { ChevronDown, CheckCheck, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AppHeaderProps {
  title: string;
  readCount?: number;

  feedType?: "rss" | "podcast";
  onFeedTypeChange?: (type: "rss" | "podcast") => void;

  categories?: string[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;

  selectedTime?: "all" | "today" | "week" | "month";
  onTimeChange?: (time: "all" | "today" | "week" | "month") => void;

  onMarkAllRead?: () => void;
  onOpenBlocklist?: () => void;
}

export default function AppHeader({
  title,
  readCount,
  feedType,
  onFeedTypeChange,
  categories = [],
  selectedCategory,
  onCategoryChange,
  selectedTime,
  onTimeChange,
  onMarkAllRead,
  onOpenBlocklist,
}: AppHeaderProps) {
  return (
    <div className="sticky top-0 z-30 bg-white px-4 pt-4">
      {/* Top Row */}
      <div className="flex items-center justify-between mb-4">
        {feedType !== undefined && onFeedTypeChange ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 text-xl font-bold hover:text-[var(--accent)]">
                {feedType === "rss" ? "Blogs & Articles" : "Podcasts"}
                <ChevronDown className="h-5 w-5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onFeedTypeChange("rss")}>
                Blogs & Articles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFeedTypeChange("podcast")}>
                Podcasts
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <h1 className="text-xl font-bold">{title}</h1>
        )}

        {readCount !== undefined && (
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-sm font-medium">
            <span>Read today</span>
            <span className="tabular-nums">{readCount}</span>
          </div>
        )}
      </div>

      {/* Bottom Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">

          {/* Category */}
          {onCategoryChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  {selectedCategory || "Category"}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onCategoryChange("All")}>
                  All
                </DropdownMenuItem>
                {categories.map((cat) => (
                  <DropdownMenuItem
                    key={cat}
                    onClick={() => onCategoryChange(cat)}
                  >
                    {cat}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Time Filter */}
          {onTimeChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  {selectedTime === "all"
                    ? "All Time"
                    : selectedTime}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {(["all", "today", "week", "month"] as const).map((time) => (
                  <DropdownMenuItem
                    key={time}
                    onClick={() => onTimeChange(time)}
                  >
                    {time === "all" ? "All Time" : time}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Actions */}
        <TooltipProvider delayDuration={150}>
          <div className="flex items-center gap-3">
            {onMarkAllRead && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onMarkAllRead}>
                    <CheckCheck className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mark all as read</TooltipContent>
              </Tooltip>
            )}

            {onOpenBlocklist && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onOpenBlocklist}>
                    <Ban className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Blocked words</TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      </div>

      <Separator className="bg-[#b0b0b0]" />
    </div>
  );
}
