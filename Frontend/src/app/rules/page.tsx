
import { useState, useEffect } from "react"
import { GripVertical } from "lucide-react" //import x for banner
import { sourcePriority, updateSourcePriorities } from "../../services/api";
import { Button } from "@/components/ui/button";
import { Sortable, SortableContent, SortableItem, SortableItemHandle, SortableOverlay } from "@/components/ui/sortable";

interface SourcePriority {
    source_id: number;
    source_name: string;
    priority: number;
}

export default function RulesPage() {
  // const [showBanner, setShowBanner] = useState(true);
  const [sources, setSources] = useState<SourcePriority[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = 3;

  useEffect(() => {
    const fetchsources = async () => {
      try {
        const data: SourcePriority[] = await sourcePriority(userId);
        setSources(data.sort((a, b) => a.priority - b.priority));
      } catch (err) {
        console.error("Failed to load subscribed sources:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchsources();
  }, [userId]);

    const handlePriorityChange = async (newOrder: SourcePriority[]) => {
  // Compute updated priorities
  const updatedSources = newOrder.map((item, idx) => ({
    ...item,
    priority: idx + 1,
  }));

  // Update local state
  setSources(updatedSources);

  // Send updated priorities to backend
  try {
    await updateSourcePriorities(userId, updatedSources);
  } catch (err) {
    console.error("Failed to save new source priorities:", err);
  }
};


  if (loading) return <p>Loading subscribed sources...</p>;
  if (sources.length === 0) return <p>No subscribed sources yet.</p>;

  return (
    <div className="p-4 w-full">
      {/* Welcome Banner */}
      {/* {showBanner && (
        <div className="relative w-full ml-0 bg-[var(--skyblue)] rounded-[var(--radius)] p-6 mb-8">
          <button
            onClick={() => setShowBanner(false)}
            className="absolute top-3 right-3 text-[var(--text)] hover:opacity-70"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold mb-2 text-[var(--text)]">
            Rules let you fine-tune your feed so it shows you only what matters most
          </h2>
          <p className="text-[var(--text)]">
            <b>Priority</b> → Rank sources higher or lower. Priority items will surface at the top of your feed so you never miss them <br />
            <b>Snooze</b> → Take a break from a source without removing it. Snoozed sources disappear for a while and come back automatically later
          </p>
        </div>
      )} */}

      {/* Sources with Priority */}
            <section className="mt-0">
        <h3 className="text-lg font-bold text-[var(--text)] mb-8">Sort your sources by assigning priorities</h3>

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
            {/* Priority number - LEFT */}
            <span className="font-semibold text-[var(--text)] w-6 text-center">
              {s.priority}
            </span>

            {/* Source name - MIDDLE */}
            <span className="flex-1 text-[var(--text)] pl-3">
              {s.source_name}
            </span>

            {/* Drag handle - RIGHT */}
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
      </section>
    </div>
  );
}



