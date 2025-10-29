
import { useState, useEffect } from "react"
// import { X } from "lucide-react"
import { allSavedItems, markItemRead } from "../../services/api";



interface SavedItems{
    item_id: number;
    title: string;
    link: string;
    description: string;
    pub_date: string | Date;
    source_name: string;
}

export default function SavedPage() {
  // const [showBanner, setShowBanner] = useState(true);
  const [savedItems, setSaveItems] = useState<SavedItems[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = 3;

  useEffect(() => {
      const fetchSavedItems = async () => {
        try {
          const data = await allSavedItems(userId);
          setSaveItems(data);
        } catch (err) {
          console.error("Failed to load saved items:", err);
        } finally {
          setLoading(false);
        }
      };
  
      fetchSavedItems();
    }, [userId]);

    if (loading) return <p>Loading saved items...</p>;
    if (savedItems.length === 0) return <p>No items saved yet.</p>;

    const handleMarkAsRead = async (itemId: number) => {
      try {
        await markItemRead(userId, itemId);
        setSaveItems((prev) => prev.filter((item) => item.item_id !== itemId));
      } catch (err) {
        console.error("Failed to mark as read:", err);
      }
    };

     return (
    <div className="p-6 w-full">
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
            Saved
          </h2>
          <p className="text-[var(--text)]">
            Found something worth keeping? Save it to build your personal library right here
          </p>
        </div>
      )} */}

      {/*Saved items*/}
      <section className="mt-0">
        <h3 className="text-lg font-bold text-[var(--text)] mb-4">Your Saved Items</h3>

        {loading ? (
          <p className="text-[var(--text-light)]">Loading saved items...</p>
        ) : savedItems.length === 0 ? (
          <p className="text-[var(--text-light)]">No saved items yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-300 w-full max-w-full">
            {savedItems.map((item) => (
              <div
                key={item.item_id}
                className="py-6 flex items-start hover:bg-[var(--hover)] transition w-full max-w-full"
              >
                <div className="flex-1 pr-4">
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
    </div>
) }

