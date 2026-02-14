import { useState, useEffect } from "react";
import { GripVertical, ChevronDown } from "lucide-react";
import {
  sourcePriority,
  updateSourcePriorities,
} from "../../services/user.service";
import { Button } from "@/components/ui/button";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "@/components/ui/sortable";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface SourcePriority {
  source_id: number;
  source_name: string;
  priority: number;
}

export default function RulesPage() {
  const [sources, setSources] = useState<SourcePriority[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState<"rss" | "podcast">("rss");
  const userId = 1;

  useEffect(() => {
    const fetchSources = async () => {
      setLoading(true);
      try {
        const data: SourcePriority[] = await sourcePriority(userId, feedType);
        setSources(data.sort((a, b) => a.priority - b.priority));
      } catch (err) {
        console.error("Failed to load subscribed sources:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSources();
  }, [userId, feedType]);

  const handlePriorityChange = async (newOrder: SourcePriority[]) => {
    const updatedSources = newOrder.map((item, idx) => ({
      ...item,
      priority: idx + 1,
    }));

    setSources(updatedSources);

    try {
      await updateSourcePriorities(userId, updatedSources, feedType);
    } catch (err) {
      console.error("Failed to save new source priorities:", err);
    }
  };

  // Loading state
  if (loading) return <p>Loading subscribed sources...</p>;

  // Empty-state banner
  if (!loading && sources.length === 0) {
    return (
      <div className="p-4 w-full">
        <div className="flex flex-col items-center justify-center w-full h-[90vh] mt-10">
          <img
            src="/rulesImage.png"
            alt="No Sources"
            className="w-80 h-auto mb-6"
          />
          <p className="text-[var(--text)] text-center">
            You haven't added any sources yet. Add sources to organize your feed
            priority.
          </p>
        </div>
      </div>
    );
  }

  // Main UI when there are sources
  return (
    <div className="p-4 w-full">
      {/* Header as Dropdown */}
      <section className="mb-6 flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <h3 className="text-lg font-bold flex items-center gap-2 cursor-pointer text-[var(--text)]">
              {feedType === "rss" ? "Blogs / Articles" : "Podcasts"}
              <ChevronDown className="h-4 w-4" />
            </h3>
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
      </section>

      {/* Sources with Priority */}
      <Sortable
        value={sources}
        onValueChange={handlePriorityChange}
        getItemValue={(item) => item.source_id}
      >
        <SortableContent asChild>
          <div className="flex flex-col divide-y divide-gray-300 w-full max-w-full">
            {sources.map((s) => (
              <SortableItem key={s.source_id} value={s.source_id} asChild>
                <div className="flex items-center justify-between p-3 rounded">
                  <span className="font-semibold text-[var(--text)] w-6 text-center">
                    {s.priority}
                  </span>
                  <span className="flex-1 text-[var(--text)] pl-3">
                    {s.source_name}
                  </span>
                  <SortableItemHandle asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 hover:bg-[var(--navyblue)] hover:text-white"
                    >
                      <GripVertical className="h-4 w-4" />
                    </Button>
                  </SortableItemHandle>
                </div>
              </SortableItem>
            ))}
          </div>
        </SortableContent>

        <SortableOverlay>
          <div className="absolute inset-0 bg-primary/10 rounded" />
        </SortableOverlay>
      </Sortable>
    </div>
  );
}
