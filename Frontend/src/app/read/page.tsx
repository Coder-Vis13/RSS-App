import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { readItems } from "../../services/api";
import { useLocation } from "react-router-dom";
import { getCategoryPresentation } from "../../lib/categoryColors";

interface ReadItems {
  item_id: number;
  title: string;
  link: string;
  description: string;
  pub_date: string | Date;
  source_name: string;
  read_time: string | Date;
  categories?: { name: string; color: string }[];
}

export default function ReadPage() {
  const [allReadItems, setAllReadItems] = useState<ReadItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState<"rss" | "podcast">("rss");
  const location = useLocation();
  const userId = 1;

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try {
        const data = await readItems(userId, feedType);
        setAllReadItems(data);
      } catch (err) {
        console.error("Failed to load read items:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [userId, feedType, location.pathname]);

  const noReadItems = !loading && allReadItems.length === 0;

  return (
    <div className="p-6 w-full">
      {/* Empty State Banner */}
      {noReadItems ? (
        <div className="flex flex-col items-center justify-center w-full h-[90vh]">
          <img
            src="/readImage.png"
            alt="Nothing Read Yet"
            className="w-80 h-auto mb-6"
          />
          <p className="text-[var(--text)] text-center">
            You haven’t read anything yet. Start exploring and your history will
            appear here.
          </p>
        </div>
      ) : (
        <section className="mt-0 w-full max-w-full">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-8">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-2xl font-bold hover:bg-transparent hover:text-[var(--accent)]"
                >
                  Read Items ({allReadItems.length})
                  <ChevronDown className="h-5 w-5" />
                </Button>
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

            <p className="text-sm text-gray-500">
              Showing:{" "}
              <span className="font-medium text-[var(--accent)]">
                {feedType === "rss" ? "Blogs / Articles" : "Podcasts"}
              </span>
            </p>
          </div>

          {/* Loading */}
          {loading ? (
            <p className="text-[var(--text-light)]">Loading read items...</p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-300 w-full max-w-full">
              {allReadItems.map((item) => (
                <div
                  key={item.item_id}
                  className="py-6 flex items-start hover:bg-[var(--hover)] transition w-full max-w-full"
                >
                  <div className="flex-1 pr-4">
                    {/* Categories */}
                    {item.categories && item.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {item.categories.map((cat) => {
                          const {
                            className: backendClasses,
                            style: backendStyle,
                          } = getCategoryPresentation(cat.color, cat.name);

                          return (
                            <span
                              key={cat.name}
                              className={`text-[12px] px-2 py-0.5 rounded-full ${backendClasses}`}
                              style={backendStyle}
                            >
                              {cat.name}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Title */}
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent)] hover:underline font-medium"
                    >
                      {item.title}
                    </a>

                    {/* Description */}
                    {item.description && (
                      <p className="text-[var(--text)] text-sm mt-1 line-clamp-3">
                        {item.description}
                      </p>
                    )}

                    {/* Meta */}
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
      )}
    </div>
  );
}

// import { useState, useEffect } from "react";
// import { ChevronDown } from "lucide-react";
// import { Button } from "../../components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuTrigger,
//   DropdownMenuContent,
//   DropdownMenuItem,
// } from "@/components/ui/dropdown-menu";
// import { readItems } from "../../services/api";
// import { useLocation } from "react-router-dom";
// import { getCategoryPresentation } from "../../lib/categoryColors";

// interface ReadItems {
//   item_id: number;
//   title: string;
//   link: string;
//   description: string;
//   pub_date: string | Date;
//   source_name: string;
//   read_time: string | Date;
//   categories?: { name: string; color: string }[];
// }

// export default function ReadPage() {
//   const [allReadItems, setAllReadItems] = useState<ReadItems[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [feedType, setFeedType] = useState<"rss" | "podcast">("rss");
//   const location = useLocation();
//   const userId = 8;

//   useEffect(() => {
//     const fetchFeed = async () => {
//       setLoading(true);
//       try {
//         const data = await readItems(userId, feedType);
//         setAllReadItems(data);
//       } catch (err) {
//         console.error("Failed to load read items:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchFeed();
//   }, [userId, feedType, location.pathname]);

//   return (
//     <div className="p-6 w-full">
//       <section className="mt-0 w-full max-w-full">
//         {/* Header Row */}
//         <div className="flex items-center justify-between mb-8">
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button
//                 variant="ghost"
//                 className="flex items-center gap-2 text-2xl font-bold hover:bg-transparent hover:text-[var(--accent)]"
//               >
//                 Read Items
//                 <ChevronDown className="h-5 w-5" />
//               </Button>
//             </DropdownMenuTrigger>

//             <DropdownMenuContent align="start" className="bg-white border border-gray-100">
//               <DropdownMenuItem onClick={() => setFeedType("rss")}>
//                 📰 Blogs / Articles
//               </DropdownMenuItem>
//               <DropdownMenuItem onClick={() => setFeedType("podcast")}>
//                 🎧 Podcasts
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>

//           <p className="text-sm text-gray-500">
//             Showing:{" "}
//             <span className="font-medium text-[var(--accent)]">
//               {feedType === "rss" ? "Blogs / Articles" : "Podcasts"}
//             </span>
//           </p>
//         </div>

//         {/* Read Items */}
//         {loading ? (
//           <p className="text-[var(--text-light)]">Loading read items...</p>
//         ) : allReadItems.length === 0 ? (
//           <p className="text-[var(--text-light)]">You haven’t read anything yet.</p>
//         ) : (
//           <div className="flex flex-col divide-y divide-gray-300 w-full max-w-full">
//             {allReadItems.map((item) => (
//               <div
//                 key={item.item_id}
//                 className="py-6 flex items-start hover:bg-[var(--hover)] transition w-full max-w-full"
//               >
//                 <div className="flex-1 pr-4">
//                   {/* Categories */}
// {/* Categories */}
// {item.categories && item.categories.length > 0 && (
//   <div className="flex flex-wrap gap-2 mb-2">
//     {item.categories.map((cat) => {
//       const { className: backendClasses, style: backendStyle } =
//         getCategoryPresentation(cat.color, cat.name);

//       return (
//         <span
//           key={cat.name}
//           className={`text-[12px] px-2 py-0.5 rounded-full ${backendClasses}`}
//           style={backendStyle}
//         >
//           {cat.name}
//         </span>
//       );
//     })}
//   </div>
// )}

//                   <a
//                     href={item.link}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="text-[var(--accent)] hover:underline font-medium"
//                   >
//                     {item.title}
//                   </a>
//                   {item.description && (
//                     <p className="text-[var(--text)] text-sm mt-1 line-clamp-3">
//                       {item.description}
//                     </p>
//                   )}
//                   {item.pub_date && (
//                     <p className="text-xs text-[var(--text-light)] mt-4">
//                       {item.source_name} •{" "}
//                       {new Date(item.pub_date).toLocaleDateString()}
//                     </p>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>
//     </div>
//   );
// }

// import { useState, useEffect } from "react";
// import { ChevronDown } from "lucide-react";
// import { Button } from "../../components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuTrigger,
//   DropdownMenuContent,
//   DropdownMenuItem,
// } from "@/components/ui/dropdown-menu";
// import { readItems } from "../../services/api";
// import { useLocation } from "react-router-dom";
// import { getCategoryPresentation } from "../../lib/categoryColors";
// import { useAuth } from "../../authContext";

// interface ReadItems {
//   item_id: number;
//   title: string;
//   link: string;
//   description: string;
//   pub_date: string | Date;
//   source_name: string;
//   read_time: string | Date;
//   categories?: { name: string; color: string }[];
// }

// export default function ReadPage() {
//   const [allReadItems, setAllReadItems] = useState<ReadItems[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [feedType, setFeedType] = useState<"rss" | "podcast">("rss");
//   // const location = useLocation();

//   // ⬅ get DB user
//   const { dbUser, loading: authLoading } = useAuth();
//   const userId = dbUser?.user_id || null;

//   useEffect(() => {
//     if (!userId || authLoading) return;

//     const fetchFeed = async () => {
//       setLoading(true);
//       try {
//         const data = await readItems(userId, feedType);
//         setAllReadItems(data);
//       } catch (err) {
//         console.error("Failed to load read items:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchFeed();
//   }, [userId, feedType, authLoading]);

//   // While auth context loads
//   if (authLoading) {
//     return <div className="p-6 w-full">Loading...</div>;
//   }

//   // If user is not logged in
//   if (!userId) {
//     return <div className="p-6 w-full">Please sign in to view read items.</div>;
//   }

//   return (
//     <div className="p-6 w-full">
//       <section className="mt-0 w-full max-w-full">

//         {/* Header Row */}
//         <div className="flex items-center justify-between mb-8">
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button
//                 variant="ghost"
//                 className="flex items-center gap-2 text-2xl font-bold hover:bg-transparent hover:text-[var(--accent)]"
//               >
//                 Read Items
//                 <ChevronDown className="h-5 w-5" />
//               </Button>
//             </DropdownMenuTrigger>

//             <DropdownMenuContent align="start" className="bg-white border border-gray-100">
//               <DropdownMenuItem onClick={() => setFeedType("rss")}>
//                 📰 Blogs / Articles
//               </DropdownMenuItem>
//               <DropdownMenuItem onClick={() => setFeedType("podcast")}>
//                 🎧 Podcasts
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>

//           <p className="text-sm text-gray-500">
//             Showing:{" "}
//             <span className="font-medium text-[var(--accent)]">
//               {feedType === "rss" ? "Blogs / Articles" : "Podcasts"}
//             </span>
//           </p>
//         </div>

//         {/* Read Items */}
//         {loading ? (
//           <p className="text-[var(--text-light)]">Loading read items...</p>
//         ) : allReadItems.length === 0 ? (
//           <p className="text-[var(--text-light)]">You haven’t read anything yet.</p>
//         ) : (
//           <div className="flex flex-col divide-y divide-gray-300 w-full max-w-full">
//             {allReadItems.map((item) => (
//               <div
//                 key={item.item_id}
//                 className="py-6 flex items-start hover:bg-[var(--hover)] transition w-full max-w-full"
//               >
//                 <div className="flex-1 pr-4">

//                   {/* Categories */}
//                   {item.categories && item.categories.length > 0 && (
//                     <div className="flex flex-wrap gap-2 mb-2">
//                       {item.categories.map((cat) => {
//                         const { className: backendClasses, style: backendStyle } =
//                           getCategoryPresentation(cat.color, cat.name);

//                         return (
//                           <span
//                             key={cat.name}
//                             className={`text-[12px] px-2 py-0.5 rounded-full ${backendClasses}`}
//                             style={backendStyle}
//                           >
//                             {cat.name}
//                           </span>
//                         );
//                       })}
//                     </div>
//                   )}

//                   <a
//                     href={item.link}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="text-[var(--accent)] hover:underline font-medium"
//                   >
//                     {item.title}
//                   </a>

//                   {item.description && (
//                     <p className="text-[var(--text)] text-sm mt-1 line-clamp-3">
//                       {item.description}
//                     </p>
//                   )}

//                   {item.pub_date && (
//                     <p className="text-xs text-[var(--text-light)] mt-4">
//                       {item.source_name} •{" "}
//                       {new Date(item.pub_date).toLocaleDateString()}
//                     </p>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>
//     </div>
//   );
// }

// import { useState, useEffect } from "react";
// import { ChevronDown } from "lucide-react";
// import { Button } from "../../components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuTrigger,
//   DropdownMenuContent,
//   DropdownMenuItem,
// } from "@/components/ui/dropdown-menu";
// import { readItems } from "../../services/api";
// import { useLocation } from "react-router-dom";
// import { getCategoryPresentation } from "../../lib/categoryColors";

// interface ReadItems {
//   item_id: number;
//   title: string;
//   link: string;
//   description: string;
//   pub_date: string | Date;
//   source_name: string;
//   read_time: string | Date;
//   categories?: { name: string; color: string }[];
// }

// export default function ReadPage() {
//   const [allReadItems, setAllReadItems] = useState<ReadItems[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [feedType, setFeedType] = useState<"rss" | "podcast">("rss");
//   const location = useLocation();
//   const userId = 8;

//   useEffect(() => {
//     const fetchFeed = async () => {
//       setLoading(true);
//       try {
//         const data = await readItems(userId, feedType);
//         setAllReadItems(data);
//       } catch (err) {
//         console.error("Failed to load read items:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchFeed();
//   }, [userId, feedType, location.pathname]);

//   return (
//     <div className="p-6 w-full">
//       <section className="mt-0 w-full max-w-full">
//         {/* Header Row */}
//         <div className="flex items-center justify-between mb-8">
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button
//                 variant="ghost"
//                 className="flex items-center gap-2 text-2xl font-bold hover:bg-transparent hover:text-[var(--accent)]"
//               >
//                 Read Items
//                 <ChevronDown className="h-5 w-5" />
//               </Button>
//             </DropdownMenuTrigger>

//             <DropdownMenuContent align="start" className="bg-white border border-gray-100">
//               <DropdownMenuItem onClick={() => setFeedType("rss")}>
//                 📰 Blogs / Articles
//               </DropdownMenuItem>
//               <DropdownMenuItem onClick={() => setFeedType("podcast")}>
//                 🎧 Podcasts
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>

//           <p className="text-sm text-gray-500">
//             Showing:{" "}
//             <span className="font-medium text-[var(--accent)]">
//               {feedType === "rss" ? "Blogs / Articles" : "Podcasts"}
//             </span>
//           </p>
//         </div>

//         {/* Read Items */}
//         {loading ? (
//           <p className="text-[var(--text-light)]">Loading read items...</p>
//         ) : allReadItems.length === 0 ? (
//           <p className="text-[var(--text-light)]">You haven’t read anything yet.</p>
//         ) : (
//           <div className="flex flex-col divide-y divide-gray-300 w-full max-w-full">
//             {allReadItems.map((item) => (
//               <div
//                 key={item.item_id}
//                 className="py-6 flex items-start hover:bg-[var(--hover)] transition w-full max-w-full"
//               >
//                 <div className="flex-1 pr-4">
//                   {/* Categories */}
// {/* Categories */}
// {item.categories && item.categories.length > 0 && (
//   <div className="flex flex-wrap gap-2 mb-2">
//     {item.categories.map((cat) => {
//       const { className: backendClasses, style: backendStyle } =
//         getCategoryPresentation(cat.color, cat.name);

//       return (
//         <span
//           key={cat.name}
//           className={`text-[12px] px-2 py-0.5 rounded-full ${backendClasses}`}
//           style={backendStyle}
//         >
//           {cat.name}
//         </span>
//       );
//     })}
//   </div>
// )}

//                   <a
//                     href={item.link}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="text-[var(--accent)] hover:underline font-medium"
//                   >
//                     {item.title}
//                   </a>
//                   {item.description && (
//                     <p className="text-[var(--text)] text-sm mt-1 line-clamp-3">
//                       {item.description}
//                     </p>
//                   )}
//                   {item.pub_date && (
//                     <p className="text-xs text-[var(--text-light)] mt-4">
//                       {item.source_name} •{" "}
//                       {new Date(item.pub_date).toLocaleDateString()}
//                     </p>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>
//     </div>
//   );
// }
