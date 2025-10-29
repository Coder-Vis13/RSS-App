import { useState, useEffect } from "react"
import { readItems } from "../../services/api";
import { useLocation } from "react-router-dom";


interface ReadItems{
    item_id: number;
    title: string;
    link: string;
    description: string;
    pub_date: string | Date;
    source_name: string;
    read_time: string | Date;
}

export default function ReadPage() {
    const [allReadItems, setAllReadItems] = useState<ReadItems[]>([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const userId = 3;

    useEffect(() => {
        const fetchFeed = async () => {
          setLoading(true);
          try {
            const data = await readItems(userId);
            setAllReadItems(data);
          } catch (err) {
            console.error("Failed to load feed:", err);
          } finally {
            setLoading(false);
          }
        };
    
        fetchFeed();
      }, [userId, location.pathname]); //refetch when route changes. this fetches newly read items into the page

        if (loading) return <p>Loading read items...</p>;
        if (allReadItems.length === 0) return <p>You haven't read anything yet.</p>;

    return (
        <div className="p-4 w-full">
      <section className="mt-0">
        <h3 className="text-lg font-bold text-[var(--text)] mb-4">Your Read Items</h3>

        {loading ? (
          <p className="text-[var(--text-light)]">Loading read items...</p>
        ) : allReadItems.length === 0 ? (
          <p className="text-[var(--text-light)]">No read items yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-300 w-full max-w-full">
            {allReadItems.map((item) => (
              <div
                key={item.item_id}
                className="py-6 flex items-start hover:bg-[var(--hover)] transition w-full max-w-full"
              >
                <div className="flex-1 pr-4">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
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
    )
    
}