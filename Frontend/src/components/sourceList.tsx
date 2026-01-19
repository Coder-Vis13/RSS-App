import { useState } from "react";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

interface Article {
  title: string;
  link: string;
  pubDate?: string;
  creator?: string;
  description?: string;
  summary?: string;
}

export default function FullSource() {
  const [url, setUrl] = useState("");
  const [sourceArticles, setSourceArticles] = useState<Article[]>([]);
  const [sourceTitle, setSourceTitle] = useState("");
  const [loadingIcon, setLoadingIcon] = useState(false);

  const addSource = async () => {
    if (!url) return;
    setLoadingIcon(true);

    try {
      const res = await fetch("http://localhost:5000/addSource", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      setSourceTitle(data.sourceTitle);
      setSourceArticles(data.sourceArticles);
    } catch (err) {
      console.error("Error fetching Source:", err);
      alert("Could not fetch the Source. Please check the URL and try again.");
    } finally {
      setLoadingIcon(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter RSS Source URL"
        className="border-secondary-border rounded-md border py-1 text-lg h-12 w-96 focus:border--grey px-4outline-none"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{ width: "300px", padding: "5px" }}
      />
      <Button
        className="py-2 px-4 h-12 rounded-r-md border-secondary-border border flex-shrink-0 bg-[var(--navyblue)] text-[var(--primary-foreground)]"
        onClick={addSource}
        disabled={loadingIcon}
        style={{ marginLeft: "10px" }}
      >
        {loadingIcon ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          "Add Source"
        )}
      </Button>

      {sourceTitle && (
        <h2 className="py-5 border-b">
          <b>Source: </b>
          {sourceTitle}
        </h2>
      )}
      <ul>
        {sourceArticles.map((item, i) => (
          <li key={i} className="mb-4 border-b pb-2 pt-1">
            <div>
              <b>Title:</b>{" "}
              <a href={item.link} target="_blank" rel="noreferrer">
                {item.title}
              </a>
            </div>
            {item.creator && (
              <div>
                <b>Author:</b> {item.creator}
              </div>
            )}
            {item.description && (
              <div>
                <b>Description:</b> {item.description}
              </div>
            )}
            {item.summary && (
              <div>
                <b>Summary:</b> {item.summary}
              </div>
            )}
            {item.pubDate && (
              <div>
                <b>Published:</b> {new Date(item.pubDate).toLocaleDateString()}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
