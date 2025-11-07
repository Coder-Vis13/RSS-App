import { useState, useEffect } from "react";
import { Search, Bookmark, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { userFeedItems, allUserSources, markItemRead, saveItem, markUserFeedItemsRead, addUserSource, removeUserSource } from "../../services/api";


interface FeedItems {
  item_id: number;
  title: string;
  link: string;
  description: string;
  pub_date: string | Date;
  source_name: string;
  is_save: boolean;
  source_id?: number;
}

interface UserSources {
  source_id: number;
  source_name: string;
  logo_url: string;
}

export default function FeedPage() {
  const [feedItems, setFeedItems] = useState<FeedItems[]>([]);
  const [sources, setSources] = useState<UserSources[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [addingSource, setAddingSource] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  //Blocklist states (persistent in localStorage)
  const [blocklist, setBlocklist] = useState<string[]>([]);
  const [blockInput, setBlockInput] = useState("");

  const userId = 3;

  // --- FEED FETCH ---
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const data = await userFeedItems(userId);
        const normalized = data.map((i: any) => ({
          ...i,
          is_save: Boolean(i.is_save),
        }));
        setFeedItems(normalized);
      } catch (err) {
        console.error("Failed to load feed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, [userId]);

  // --- SOURCES ---
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const sourcedata = await allUserSources(userId);
        setSources(sourcedata);
      } catch (err) {
        console.error("Failed to load sources:", err);
      }
    };
    fetchSources();
  }, [userId]);

  // --- BLOCKLIST LOAD (runs once on mount) ---
  useEffect(() => {
    const stored = localStorage.getItem("blocklist");
    if (stored) {
      try {
        console.log("loading blocklist", localStorage.getItem("blocklist"));
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) 
          setBlocklist(parsed);
      } catch (e) {
        console.warn("Corrupted blocklist, resetting");
        console.error("Failed to parse blocklist:", e);
        setBlocklist([]);
      }
    }
  }, []);

  // --- BLOCKLIST SAVE ---
  useEffect(() => {
    localStorage.setItem("blocklist", JSON.stringify(blocklist));
  }, [blocklist]);

  // --- MARK READ FUNCTIONS ---
  const handleMarkAsRead = async (itemId: number) => {
    try {
      await markItemRead(userId, itemId);
      setFeedItems((i) => i.filter((item) => item.item_id !== itemId));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAsReadFeed = async (userIdParam?: number) => {
    try {
      const uid = userIdParam ?? userId;
      await markUserFeedItemsRead(uid);
      const updatedFeed = await userFeedItems(uid);
      const normalized = updatedFeed.map((i: any) => ({
        ...i,
        is_save: Boolean(i.is_save),
      }));
      setFeedItems(normalized);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // --- SAVE ITEM ---
  const handleSave = async (itemId: number) => {
    const item = feedItems.find((i) => i.item_id === itemId);
    if (!item) return;

    const intended = !item.is_save;
    setFeedItems((i) =>
      i.map((i) => (i.item_id === itemId ? { ...i, is_save: intended } : i))
    );

    try {
      await saveItem(userId, itemId, intended);
      const refreshedFeed = await userFeedItems(userId);
      const normalized = refreshedFeed.map((i: any) => ({
        ...i,
        is_save: Boolean(i.is_save),
      }));
      setFeedItems(normalized);
    } catch (err) {
      console.error("Failed to toggle save:", err);
    }
  };

  // --- ADD SOURCE ---
  const handleAddSource = async () => {
    if (!newSourceUrl.trim()) return;
    setAddingSource(true);
    setAddError(null);
    try {
      await addUserSource(userId, newSourceUrl);
      toast.success("Feed added successfully!");
      setNewSourceUrl("");
      const refreshedSources = await allUserSources(userId);
      setSources(refreshedSources);
    } catch (err: any) {
      console.error(err);
      setAddError("Could not add source. Please check the URL or try a different one.");
      toast.error("Failed to add this source. Please try a different URL");
    } finally {
      setAddingSource(false);
    }
  };

  // --- REMOVE SOURCE ---
  const handleRemoveUserSource = async (sourceId: number) => {
    if (!confirm("Are you sure you want to remove this source?")) return;
    try {
      await removeUserSource(userId, sourceId);
      setSources((i) => i.filter((s) => s.source_id !== sourceId));
      setFeedItems((i) =>
        i.filter((item) => item.source_id && item.source_id !== sourceId)
      );
      toast.success("Source removed successfully!");
    } catch (err) {
      console.error("Failed to remove source:", err);
      toast.error("Could not remove the source. Please try again.");
      const refreshedSources = await allUserSources(userId);
      setSources(refreshedSources);
      const refreshedFeed = await userFeedItems(userId);
      setFeedItems(refreshedFeed.map((i: any) => ({ ...i, is_save: Boolean(i.is_save) })));
    }
  };

  // --- BLOCKLIST HANDLERS ---
  const addWord = () => {
    const word = blockInput.trim().toLowerCase();
    if (!word) return;
    if (blocklist.includes(word)) {
      toast.error(`"${word}" is already blocked`);
      setBlockInput("");
      return;
    }
    setBlocklist((i) => [...i, word]);
    setBlockInput("");
    toast.success(`Blocked "${word}"`);
  };

  const removeWord = (word: string) => {
    setBlocklist((i) => i.filter((w) => w !== word));
    toast.info(`Removed "${word}"`);
  };

  // --- FILTER FEED BY BLOCKLIST ---
  const filteredFeedItems = feedItems.filter((article) => {
    if (!article) return false;
    const title = (article.title || "").toLowerCase();
    const desc = (article.description || "").toLowerCase();
    return !blocklist.some((word) => title.includes(word) || desc.includes(word));
  });

  // --- GROUP FEED BY SOURCE ---
  const groupedFeed = filteredFeedItems.reduce((acc, item) => {
    if (!acc[item.source_name]) acc[item.source_name] = [];
    acc[item.source_name].push(item);
    return acc;
  }, {} as Record<string, FeedItems[]>);

  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const toggleSource = (source: string) => {
    setExpandedSources((i) => ({
      ...i,
      [source]: !i[source],
    }));
  };

  // --- UI ---
  return (
    <div className="flex min-h-screen w-full">
      <main className="flex-1 p-4 max-w-full overflow-x-hidden">
        <h2 className="text-xl font-bold mb-12">Your feed</h2>

        {/* Add Source */}
        <div className="flex mb-6 w-full max-w-full">
          <input
            type="search"
            placeholder="Paste website url"
            value={newSourceUrl}
            onChange={(e) => setNewSourceUrl(e.target.value)}
            className="rounded-l-md border border-secondary-border py-1 text-lg h-10 px-4 w-96 focus:border--grey outline-none"
          />
          <Button className="flex-shrink-0 h-10 py-2 px-4 rounded-none rounded-r-md">
            <Search />
          </Button>
          <Button
            className="ml-4 h-10 py-2 px-4 rounded-md"
            disabled={addingSource}
            onClick={handleAddSource}
          >
            {addingSource ? "Adding..." : "Add Feed"}
          </Button>
        </div>
        {addError && <p className="text-red-500 mt-2">{addError}</p>}

        {/* Sources */}
        <section className="mt-10 w-full max-w-full">
          <h3 className="text-lg font-semibold mb-4">Your Sources</h3>
          <div className="flex flex-col divide-y divide-gray-300">
            {sources.map((i) => (
              <div key={i.source_id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  {i.logo_url ? (
                    <img
                      src={i.logo_url}
                      alt={`${i.source_name} logo`}
                      className="w-6 h-6 rounded object-contain"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded bg-gray-200" />
                  )}
                  <p>{i.source_name}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:text-red-500 hover:bg-transparent rounded-full px-3 py-1"
                  onClick={() => handleRemoveUserSource(i.source_id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Feed */}
        <section className="mt-10 w-full max-w-full">
          <div className="mb-4 flex justify-between items-center">
            <div />
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-[var(--text)] bg-[var(--light-grey)] hover:text-[var(--sidebar-active-foreground)] hover:bg-[var(--navyblue)]"
                onClick={() => handleMarkAsReadFeed(userId)}
              >
                Mark all articles as read
              </Button>

              {/* Blocklist Modal */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="text-[var(--text)] bg-[var(--light-grey)] hover:text-[var(--sidebar-active-foreground)] hover:bg-[var(--navyblue)]">
                    Blocked Words
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-white text-black">
                  <DialogHeader>
                    <DialogTitle>Blocked Words</DialogTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Articles containing these words in title or description will be hidden.
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
                      <p className="text-sm text-gray-400">No blocked words yet.</p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading feed...</p>
          ) : filteredFeedItems.length === 0 ? (
            <div className="w-full text-center py-10 text-gray-400">
              No feed items yet.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-gray-300">
              {Object.entries(groupedFeed).map(([source, items]) => {
                const isExpanded = expandedSources[source];
                const visibleItems = isExpanded ? items : items.slice(0, 15);

                return (
                  <div key={source} className="mb-8">
                    <h4 className="text-lg font-semibold mb-3">{source}</h4>
                    <div className="flex flex-col divide-y divide-gray-300 w-full max-w-full">
                    {visibleItems.map((item) => (
                      <div
                        key={item.item_id}
                        className="py-6 flex divide-gray-300 items-start hover:bg-[var(--hover)] transition"
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
                            <p className="text-sm mt-1 line-clamp-3 text-[var(--text)]">
                              {item.description}
                            </p>
                          )}
                          {item.pub_date && (
                            <p className="text-xs text-gray-500 mt-4">
                              {new Date(item.pub_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleSave(item.item_id)}>
                          <Bookmark
                            size={24}
                            className={
                              item.is_save
                                ? "text-[var(--accent)] fill-[var(--accent)]"
                                : "text-gray-400"
                            }
                          />
                        </Button>
                      </div>
                    ))}

                    {items.length > 15 && (
                      <div className="flex justify-center mt-4 mb-4">
                        <Button
                          variant="ghost"
                          className="text-[var(--accent)] hover:text-[var(--navyblue)]"
                          onClick={() => toggleSource(source)}
                        >
                          {isExpanded ? "Show less" : `Show ${items.length - 15} more`}
                        </Button>
                      </div>
                    )}
                  </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}








// import { useState, useEffect } from "react";
// import { Search, Bookmark } from "lucide-react"; //import X for banner
// import { Button } from "../../components/ui/button";
// import { toast } from "sonner";
// import {
//   userFeedItems,
//   allUserSources,
//   markItemRead,
//   saveItem,
//   markUserFeedItemsRead,
//   addUserSource,
//   removeUserSource,
// } from "../../services/api";

// interface FeedItems {
//   item_id: number;
//   title: string;
//   link: string;
//   description: string;
//   pub_date: string | Date;
//   source_name: string;
//   is_save: boolean;
//   source_id?: number;
// }

// interface UserSources {
//   source_id: number;
//   source_name: string;
//   logo_url: string;
// }

// export default function FeedPage() {
//   // const [showBanner, setShowBanner] = useState(true);
//   const [feedItems, setFeedItems] = useState<FeedItems[]>([]);
//   const [sources, setSources] = useState<UserSources[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [newSourceUrl, setNewSourceUrl] = useState("");
//   const [addingSource, setAddingSource] = useState(false);
//   const [addError, setAddError] = useState<string | null>(null);

//   const userId = 3;

//   useEffect(() => {
//     const fetchFeed = async () => {
//       try {
//         const data = await userFeedItems(userId);
//         const normalized = data.map((i: any) => ({ ...i, is_save: Boolean(i.is_save) }));
//         setFeedItems(normalized);
//       } catch (err) {
//         console.error("Failed to load feed:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchFeed();
//   }, [userId]);

//   useEffect(() => {
//     const fetchSources = async () => {
//       try {
//         const sourcedata = await allUserSources(userId);
//         setSources(sourcedata);
//       } catch (err) {
//         console.error("Failed to load sources:", err);
//       }
//     };
//     fetchSources();
//   }, [userId]);

//   const handleMarkAsRead = async (itemId: number) => {
//     try {
//       await markItemRead(userId, itemId);
//       setFeedItems((i) => i.filter((item) => item.item_id !== itemId));
//     } catch (err) {
//       console.error("Failed to mark as read:", err);
//     }
//   };

//   const handleMarkAsReadFeed = async (userId: number) => {
//     try {
//       await markUserFeedItemsRead(userId);
//       const updatedFeed = await userFeedItems(userId);
//       const normalized = updatedFeed.map((i: any) => ({ ...i, is_save: Boolean(i.is_save) }));
//       setFeedItems(normalized);
//     } catch (err) {
//       console.error("Failed to mark as read:", err);
//     }
//   };

//   const handleSave = async (itemId: number) => {
//     const item = feedItems.find((i) => i.item_id === itemId);
//     if (!item) return;

//     const intended = !item.is_save;
//     setFeedItems((i) =>
//       i.map((i) => (i.item_id === itemId ? { ...i, is_save: intended } : i))
//     );

//     try {
//       await saveItem(userId, itemId, intended);
//       const refreshedFeed = await userFeedItems(userId);
//       const normalized = refreshedFeed.map((i: any) => ({ ...i, is_save: Boolean(i.is_save) }));
//       setFeedItems(normalized);
//     } catch (err) {
//       console.error("Failed to toggle save:", err);
//     }
//   };

//   const handleAddSource = async () => {
//     if (!newSourceUrl.trim()) return;
//     setAddingSource(true);
//     setAddError(null);
//     try {
//       await addUserSource(userId, newSourceUrl);
//       toast.success("Feed added successfully!");
//       setNewSourceUrl("");
//       allUserSources(userId).then(setSources).catch((err) => console.error(err));
//     } catch (err: any) {
//       console.error(err);
//       setAddError("Could not add source. Please check the URL or try a different one.");
//       toast.error("Failed to add this source. Please try a different URL");
//     } finally {
//       setAddingSource(false);
//     }
//   };

//   const handleRemoveUserSource = async (sourceId: number) => {
//     if (!confirm("Are you sure you want to remove this source?")) return;

//     try {
//       await removeUserSource(userId, sourceId);
//       setSources((i) => i.filter((s) => s.source_id !== sourceId));
//       setFeedItems((i) =>
//         i.filter((item) => item.source_id && item.source_id !== sourceId)
//       );
//       toast.success("Source removed successfully!");
//     } catch (err) {
//       console.error("Failed to remove source:", err);
//       toast.error("Could not remove the source. Please try again.");
//       const refreshedSources = await allUserSources(userId);
//       setSources(refreshedSources);

//       const refreshedFeed = await userFeedItems(userId);
//       setFeedItems(refreshedFeed.map((i: any) => ({ ...i, is_save: Boolean(i.is_save) })));
//     }
//   };

//   // Group feed items by source
// const groupedFeed = feedItems.reduce((acc, item) => {
//   if (!acc[item.source_name]) acc[item.source_name] = [];
//   acc[item.source_name].push(item);
//   return acc;
// }, {} as Record<string, FeedItems[]>);

// // Track which sources are expanded
// const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
// const toggleSource = (source: string) => {
//   setExpandedSources((i) => ({
//     ...i,
//     [source]: !i[source],
//   }));
// };


//   return (
//     <div className="flex min-h-screen w-full">
//       <main className="flex-1 p-4 max-w-full overflow-x-hidden">
//         <h2 className="text-xl font-bold mb-12">Your feed</h2>
//         {/* Banner */}
//         {/* {showBanner && (
//           <div className="relative w-full max-w-full bg-[var(--skyblue)] rounded-[var(--radius)] p-6 mb-8">
//             <button
//               onClick={() => setShowBanner(false)}
//               className="absolute top-3 right-3 text-[var(--text)] hover:opacity-70"
//             >
//               <X className="h-5 w-5" />
//             </button>
//             <h2 className="text-xl font-semibold mb-2 text-[var(--text)]">
//               Welcome to your Feed!
//             </h2>
//             <p className="text-[var(--text)]">
//               You don’t have any sources yet. Add a new source to start building your
//               personalized feed.
//             </p>
//           </div>
//         )} */}

//         {/* Search Bar */}
//         <div className="flex mb-6 w-full max-w-full">
//           <input
//             type="search"
//             placeholder="Paste website url"
//             value={newSourceUrl}
//             onChange={(e) => setNewSourceUrl(e.target.value)}
//             className="rounded-l-md border border-secondary-border py-1 text-lg h-10 px-4 w-96 focus:border--grey outline-none"
//           />
//           <Button className="flex-shrink-0 h-10 py-2 px-4 rounded-none rounded-r-md">
//             <Search />
//           </Button>
//           <Button
//             className="ml-4 h-10 py-2 px-4 rounded-md"
//             disabled={addingSource}
//             onClick={handleAddSource}
//           >
//             {addingSource ? "Adding..." : "Add Feed"}
//           </Button>
//         </div>
//         {addError && <p className="text-red-500 mt-2">{addError}</p>}

//         {/* Sources */}
//         <section className="mt-10 w-full max-w-full">
//           <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Your Sources</h3>
//           <div className="flex flex-col divide-y divide-gray-300">

//             {sources.map((i) => (
//             <div key={i.source_id} className="flex items-center justify-between py-3">
//             <div className="flex items-center gap-3">
//              {i.logo_url ? (
//               <img
//                 src={i.logo_url}
//                 alt={`${i.source_name} logo`}
//                 className="w-6 h-6 rounded object-contain"
//               />
//             ) : (
//               <div className="w-6 h-6 rounded bg-gray-200" />
//               )}
//               <p>{i.source_name}</p>
//             </div>
//           <Button
//                   variant="ghost"
//                   size="sm"
//                   className="text-[var(--text-light)] hover:text-red-500 hover:bg-transparent transition-all rounded-full px-3 py-1 flex-shrink-0"
//                   onClick={() => handleRemoveUserSource(i.source_id)}
//                 >
//                   Remove
//             </Button>
//           </div>
//           ))}

//             {/* {sources.map((i) => (
//               <div
//                 key={i.source_id}
//                 className="flex items-center justify-between py-3 group transition w-full max-w-full"
//               >
//                 <div className="flex items-center gap-3">
//                   <div className="w-2 h-2 rounded-full bg-[var(--accent)] opacity-70 group-hover:opacity-100 transition" />
//                   <p className="text-[var(--text)] font-medium group-hover:text-[var(--accent)] transition">
//                     {i.source_name}
//                   </p>
//                 </div>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   className="text-[var(--text-light)] hover:text-red-500 hover:bg-transparent transition-all rounded-full px-3 py-1 flex-shrink-0"
//                   onClick={() => handleRemoveUserSource(i.source_id)}
//                 >
//                   Remove
//                 </Button>
//               </div>
//             ))} */}
//           </div>
//         </section>

//         {/* Feed Items */}
//         <section className="mt-10 w-full max-w-full">
//           {/* <h3 className="text-lg font-bold text-[var(--text)] mb-4">Your Feed</h3> */}

//           {loading ? (
//             <p className="text-[var(--text-light)]">Loading feed...</p>
//           ) : feedItems.length === 0 ? (
//             <div className="w-full text-center py-10 text-[var(--text-light)]">
//               No feed items yet.
//             </div>
//           ) : (
//             <div className="w-full max-w-full">
//               <div className="mb-4 flex justify-end">
//                 <Button
//                   variant="ghost"
//                   className="text-[var(--text)] bg-[var(--light-grey)] hover:text-[var(--sidebar-active-foreground)] hover:bg-[var(--navyblue)]"
//                   onClick={() => handleMarkAsReadFeed(userId)}
//                 >
//                   Mark all articles as read
//                 </Button>
//               </div>

//               <div className="flex flex-col divide-y divide-gray-300 w-full max-w-full">
//   {Object.entries(groupedFeed).map(([source, items]) => {
//     const isExpanded = expandedSources[source];
//     const visibleItems = isExpanded ? items : items.slice(0, 15);

//     return (
//       <div key={source} className="mb-8">
//         <h4 className="text-lg font-semibold mb-3 text-[var(--text)]">{source}</h4>

//         {visibleItems.map((item) => (
//           <div
//             key={item.item_id}
//             className="py-6 flex items-start hover:bg-[var(--hover)] transition w-full max-w-full"
//           >
//             <div className="flex-1 pr-4">
//               <a
//                 href={item.link}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 onClick={() => handleMarkAsRead(item.item_id)}
//                 className="text-[var(--accent)] hover:underline font-medium"
//               >
//                 {item.title}
//               </a>
//               {item.description && (
//                 <p className="text-[var(--text)] text-sm mt-1 line-clamp-3">
//                   {item.description}
//                 </p>
//               )}
//               {item.pub_date && (
//                 <p className="text-xs text-[var(--text-light)] mt-4">
//                   {new Date(item.pub_date).toLocaleDateString()}
//                 </p>
//               )}
//             </div>
//             <div className="flex-shrink-0">
//               <Button variant="ghost" size="icon" onClick={() => handleSave(item.item_id)}>
//                 <Bookmark
//                   size={24}
//                   className={
//                     item.is_save
//                       ? "text-[var(--accent)] fill-[var(--accent)]"
//                       : "text-[var(--text-light)]"
//                   }
//                 />
//               </Button>
//             </div>
//           </div>
//         ))}

//         {/* Show More / Show Less button */}
//         {items.length > 15 && (
//           <div className="flex justify-center mt-4 mb-4">
//             <Button
//               variant="ghost"
//               className="text-[var(--accent)] hover:text-[var(--navyblue)]"
//               onClick={() => toggleSource(source)}
//             >
//               {isExpanded ? "Show less" : `Show ${items.length - 15} more`}
//             </Button>
//           </div>
//         )}
//       </div>
//     );
//   })}
// </div>


//               {/* <div className="flex flex-col divide-y divide-gray-300 w-full max-w-full">
//                 {feedItems.map((item) => (
//                   <div
//                     key={item.item_id}
//                     className="py-6 flex items-start hover:bg-[var(--hover)] transition w-full max-w-full"
//                   >
//                     <div className="flex-1 pr-4">
//                       <a
//                         href={item.link}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         onClick={() => handleMarkAsRead(item.item_id)}
//                         className="text-[var(--accent)] hover:underline font-medium"
//                       >
//                         {item.title}
//                       </a>
//                       {item.description && (
//                         <p className="text-[var(--text)] text-sm mt-1 line-clamp-3">
//                           {item.description}
//                         </p>
//                       )}
//                       {item.pub_date && (
//                         <p className="text-xs text-[var(--text-light)] mt-4">
//                           {item.source_name} •{" "}
//                           {new Date(item.pub_date).toLocaleDateString()}
//                         </p>
//                       )}
//                     </div>
//                     <div className="flex-shrink-0">
//                       <Button variant="ghost" size="icon" onClick={() => handleSave(item.item_id)}>
//                         <Bookmark
//                           size={24}
//                           className={
//                             item.is_save
//                               ? "text-[var(--accent)] fill-[var(--accent)]"
//                               : "text-[var(--text-light)]"
//                           }
//                         />
//                       </Button>
//                     </div>
//                   </div>
//                 ))}
//               </div>    ///// */}
//             </div>
//           )}
//         </section>
//       </main>
//     </div>
//   );
// }









// import { useState, useEffect } from "react"
// import { X, Search, Bookmark } from "lucide-react"
// import { Button } from "../../components/ui/button"
// import { toast } from "sonner"
// import { userFeedItems, allUserSources, markItemRead, saveItem, markUserFeedItemsRead, addUserSource, removeUserSource } from "../../services/api";

// interface FeedItems{
//     item_id: number;
//     title: string;
//     link: string;
//     description: string;
//     pub_date: string | Date;
//     source_name: string;
//     is_save: boolean;
//     source_id?: number;
// }

// interface UserSources {
//     source_id: number;
//     source_name: string;
// }



// export default function FeedPage() {
//   const [showBanner, setShowBanner] = useState(true);
//   const [feedItems, setFeedItems] = useState<FeedItems[]>([]);
//   const [sources, setSources] = useState<UserSources[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [newSourceUrl, setNewSourceUrl] = useState("");
//   const [addingSource, setAddingSource] = useState(false);
//   const [addError, setAddError] = useState<string | null>(null);


//   const userId = 3;
//   useEffect(() => {
//    const fetchFeed = async () => {
//     try {
//     const data = await userFeedItems(userId);
//     const normalized = data.map((i: any) => ({
//       ...i,
//       is_save: Boolean(i.is_save),
//     }));
//     setFeedItems(normalized);
//   } catch (err) {
//     console.error("Failed to load feed:", err);
//   } finally {
//     setLoading(false);
//   }
// };


//     fetchFeed();
//   }, [userId]);


//   useEffect(() => {
//     const fetchSources = async () => {
//       try {
//         const sourcedata = await allUserSources(userId);
//         setSources(sourcedata);
//       } catch (err) {
//         console.error("Failed to load sources:", err);
//       }
//     };

//     fetchSources();
//   }, [userId]);

//   const handleMarkAsRead = async (itemId: number) => {
//     try {
//       await markItemRead(userId, itemId);
//       setFeedItems((i) => i.filter((item) => item.item_id !== itemId));
//     } catch (err) {
//       console.error("Failed to mark as read:", err);
//     }
//   };

//   const handleMarkAsReadFeed = async (userId: number) => {
//   try {
//     await markUserFeedItemsRead(userId);
//     const updatedFeed = await userFeedItems(userId);
//     const normalized = updatedFeed.map((i: any) => ({
//       ...i,
//       is_save: Boolean(i.is_save),
//     }));
//     setFeedItems(normalized);
//   } catch (err) {
//     console.error("Failed to mark as read:", err);
//   }
// };

// const handleSave = async (itemId: number) => {
//   const item = feedItems.find(i => i.item_id === itemId);
//   if (!item) return;

//   const intended = !item.is_save;
//   setFeedItems(i =>
//     i.map(i => (i.item_id === itemId ? { ...i, is_save: intended } : i))
//   );

//   try {
//     await saveItem(userId, itemId, intended);
//     const refreshedFeed = await userFeedItems(userId);
//     const normalized = refreshedFeed.map((i: any) => ({
//       ...i,
//       is_save: Boolean(i.is_save),
//     }));
//     setFeedItems(normalized);
//   } catch (err) {
//     console.error("Failed to toggle save:", err);
//   }
// };

// const handleAddSource = async() => {
//   if (!newSourceUrl.trim()) return;
//     setAddingSource(true);
//     setAddError(null);
//     try {
//       await addUserSource(userId, newSourceUrl);
//       toast.success("Feed added successfully!");
//       setNewSourceUrl(""); // clear input
//        allUserSources(userId)
//       .then(setSources)
//       .catch(err => console.error("Failed to refresh sources:", err));
//     } catch (err: any) {
//       console.error(err);
//       setAddError("Could not add source. Please check the URL or try a different one.");
//       toast.error("Failed to add this source. Please try a different URL");
//     } finally {
//       setAddingSource(false);
//     }
// }

// const handleRemoveUserSource = async(sourceId: number) => {
//   if (!confirm("Are you sure you want to remove this source?")) return;

//   try {
//     await removeUserSource(userId, sourceId);
//     setSources(i => i.filter(s => s.source_id !== sourceId));
//     setFeedItems(i => i.filter(item => item.source_id && item.source_id !== sourceId));
//     toast.success("Source removed successfully!");
//   } catch (err) {
//     console.error("Failed to remove source:", err);
//     toast.error("Could not remove the source. Please try again.");
//     const refreshedSources = await allUserSources(userId);
//     setSources(refreshedSources);

//     const refreshedFeed = await userFeedItems(userId);
//     setFeedItems(refreshedFeed.map((i: any) => ({
//       ...i,
//       is_save: Boolean(i.is_save),
//     })));
//   }
// }

//   return (
//     // Use flex to make sidebar + main content layout
//     <div className="flex min-h-screen">
//       {/* Sidebar is fixed separately, so main content needs margin */}
//       <main className="flex-1 p-4 mr-4 overflow-x-hidden">
//         {/* Banner */}
//         {showBanner && (
//           <div className="relative w-full bg-[var(--skyblue)] rounded-[var(--radius)] p-6 mb-8">
//             <button
//               onClick={() => setShowBanner(false)}
//               className="absolute top-3 right-3 text-[var(--text)] hover:opacity-70"
//             >
//               <X className="h-5 w-5" />
//             </button>
//             <h2 className="text-xl font-semibold mb-2 text-[var(--text)]">
//               Welcome to your Feed!
//             </h2>
//             <p className="text-[var(--text)]">
//               You don’t have any sources yet. Add a new source to start building your personalized feed.
//             </p>
//           </div>
//         )}

//         {/* Search Bar */}
//         <div className="flex mb-6">
//           <input
//             type="search"
//             placeholder="Paste url"
//             value={newSourceUrl}
//             onChange={(e) => setNewSourceUrl(e.target.value)}
//             className="rounded-l-full border border-secondary-border py-1 text-lg h-10 px-4 w-96 focus:border--grey outline-none"
//           />
//           <Button className="flex-shrink-0 h-10 py-2 px-4 rounded-r-full border-secondary-border border border-l-0">
//             <Search />
//           </Button>
//           <Button
//             className="ml-4 h-10 py-2 px-4 rounded-full"
//             disabled={addingSource}
//             onClick={handleAddSource}
//           >
//             {addingSource ? "Adding..." : "Add Feed"}
//           </Button>
//         </div>
//         {addError && <p className="text-red-500 mt-2">{addError}</p>}

//         {/* Sources */}
//         <section className="mt-10">
//           <h3 className="text-lg font-semibold text-[var(--text)] mb-4">
//             Your Sources
//           </h3>
//           <div className="flex flex-col divide-y divide-gray-300">
//             {sources.map((i) => (
//               <div
//                 key={i.source_id}
//                 className="flex items-center justify-between py-3 group transition"
//               >
//                 <div className="flex items-center gap-3">
//                   <div className="w-2 h-2 rounded-full bg-[var(--accent)] opacity-70 group-hover:opacity-100 transition" />
//                   <p className="text-[var(--text)] font-medium group-hover:text-[var(--accent)] transition">
//                     {i.source_name}
//                   </p>
//                 </div>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   className="text-[var(--text-light)] hover:text-red-500 hover:bg-transparent transition-all rounded-full px-3 py-1"
//                   onClick={() => handleRemoveUserSource(i.source_id)}
//                 >
//                   Remove
//                 </Button>
//               </div>
//             ))}
//           </div>
//         </section>

//         {/* Feed Items */}
//         <section className="mt-10">
//           <h3 className="text-lg font-bold text-[var(--text)] mb-4">Your Feed</h3>

//           {loading ? (
//             <p className="text-[var(--text-light)]">Loading feed...</p>
//           ) : feedItems.length === 0 ? (
//             <p className="text-[var(--text-light)]">No feed items yet.</p>
//           ) : (
//             <div>
//               <div className="mb-4 flex justify-end">
//                 <Button
//                   variant="ghost"
//                   className="text-[var(--text)] bg-[var(--light-grey)] hover:text-[var(--sidebar-active-foreground)] hover:bg-[var(--navyblue)]"
//                   onClick={() => handleMarkAsReadFeed(userId)}
//                 >
//                   Mark all articles as read
//                 </Button>
//               </div>

//               <div className="flex flex-col divide-y divide-gray-300">
//                 {feedItems.map((item) => (
//                   <div
//                     key={item.item_id}
//                     className="py-4 flex items-start hover:bg-[var(--hover)] transition"
//                   >
//                     <div className="flex-1 pr-4">
//                       <a
//                         href={item.link}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         onClick={() => handleMarkAsRead(item.item_id)}
//                         className="text-[var(--accent)] hover:underline font-medium"
//                       >
//                         {item.title}
//                       </a>
//                       {item.description && (
//                         <p className="text-[var(--text)] text-sm mt-1 line-clamp-3">
//                           {item.description}
//                         </p>
//                       )}
//                       {item.pub_date && (
//                         <p className="text-xs text-[var(--text-light)] mt-2">
//                           [{item.source_name} • {new Date(item.pub_date).toLocaleDateString()}]
//                         </p>
//                       )}
//                     </div>
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       onClick={() => handleSave(item.item_id)}
//                     >
//                       <Bookmark
//                         size={24}
//                         className={
//                           item.is_save
//                             ? "text-[var(--accent)] fill-[var(--accent)]"
//                             : "text-[var(--text-light)]"
//                         }
//                       />
//                     </Button>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </section>
//       </main>
//     </div>
//   );
// }
