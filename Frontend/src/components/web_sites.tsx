import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { presetSources } from "@/services/api";
import { toast } from "sonner";
import { allUserRSSSources, allUserPodcastSources} from "../services/api"

interface Source {
  id: number;
  name: string;
  description: string;
  category: string;
}

const blogSources: Source[] = [
  // NEWS
  { id: 3, name: "The Hindu", description: "In-depth Indian news and analysis.", category: "News" },
  { id: 8, name: "Indian Express", description: "Trusted Indian journalism and editorials.", category: "News" },
  { id: 29, name: "The Guardian", description: "Independent journalism covering world news and politics around the globe.", category: "News" },
  { id: 30, name: "Deccan Herald", description: "Indian news source featuring national, international, and regional updates.", category: "News" },
  { id: 14, name: "NDTV", description: "Global breaking news and analysis covering politics, business, and current affairs.", category: "News" },

  // TECH
  { id: 26, name: "Stratechery", description: "Smart analysis of tech business and strategy.", category: "Tech" },
  { id: 31, name: "WIRED", description: "In-depth reporting on technology, culture, science and innovation.", category: "Tech" },

  // PRODUCTIVITY
  { id: 34, name: "Mark Manson", description: "Delivers direct, research-based advice on personal growth and life skills.", category: "Productivity" },
  { id: 35, name: "James Clear", description: "Offers clear, actionable insights on building better habits and continuous improvement.", category: "Productivity" },

  // LIFESTYLE
  { id: 18, name: "Vogue India", description: "Fashion, lifestyle, and beauty trends from India.", category: "Lifestyle" },
  { id: 19, name: "Harper’s Bazaar", description: "Luxury fashion and culture magazine.", category: "Lifestyle" },

  // FOOD
  { id: 21, name: "Serious Eats", description: "Science-based cooking and recipe insights.", category: "Food" },

  // PHOTOGRAPHY
  { id: 25, name: "Eric Kim Blog", description: "Street photography essays and visual philosophy.", category: "Photography" },

  // ENTERTAINMENT
  { id: 27, name: "Bollywood Hungama", description: "Latest Bollywood news and film updates.", category: "Entertainment" },

  // CULTURE
  { id: 37, name: "Aeon", description: "Thoughtful essays on philosophy, culture, and the human experience.", category: "Culture" },
];

const podcastSources: Source[] = [
  { id: 53, name: "This Past Weekend w/ Theo Von", description: "Comedian Theo Von’s podcast mixing humor, stories, and guest conversations.", category: "Entertainment" },
  { id: 54, name: "The Joe Rogan Experience", description: "Long-form conversations with guests from every field imaginable.", category: "Culture" },
  { id: 55, name: "Call Her Daddy", description: "Conversations on modern relationships, self-discovery, and pop culture.", category: "Lifestyle" },
  { id: 56, name: "The Tucker Carlson Show", description: "Political and cultural commentary from Tucker Carlson.", category: "News" },
  { id: 57, name: "Good Hang with Amy Poehler", description: "Funny, thoughtful chats with fascinating guests.", category: "Entertainment" },
  { id: 58, name: "The Diary Of A CEO with Steven Bartlett", description: "Candid interviews with successful leaders about their journeys.", category: "Business" },
  { id: 59, name: "The Mel Robbins Podcast", description: "Science-backed advice on mindset, habits, and motivation.", category: "Productivity" },
  { id: 60, name: "Huberman Lab", description: "Neuroscience insights for improving focus, sleep, and mental health.", category: "Health" },
  { id: 61, name: "The Sadhguru Podcast - Of Mystics and Mistakes", description: "Talks on spirituality, wisdom, and well-being.", category: "Spirituality" },
  { id: 62, name: "Gita For Daily Living", description: "Applying the Bhagavad Gita’s wisdom to everyday life.", category: "Spirituality" },
  { id: 63, name: "The Daily Brief", description: "Concise daily updates on global and Indian current affairs.", category: "News" },
  { id: 64, name: "WTF is with Nikhil Kamath", description: "Conversations on business, investing, and life lessons.", category: "Finance" },
];

// category → color mapping
const categoryColors: Record<string, string> = {
  News: "bg-blue-100 text-blue-700",
  Tech: "bg-sky-100 text-sky-700",
  Productivity: "bg-teal-100 text-teal-700",
  Lifestyle: "bg-purple-100 text-purple-700",
  Food: "bg-orange-100 text-orange-700",
  Photography: "bg-green-100 text-green-700",
  Entertainment: "bg-pink-100 text-pink-700",
  Culture: "bg-indigo-100 text-indigo-700",
  Career: "bg-amber-100 text-amber-700",
  Business: "bg-amber-100 text-amber-700",
  Health: "bg-emerald-100 text-emerald-700",
  Spirituality: "bg-yellow-100 text-yellow-700",
  Finance: "bg-gray-200 text-gray-700",
};

export const Sites: React.FC<{ userId: number }> = ({ userId }) => {
  const [rssSubscribed, setRssSubscribed] = useState<number[]>([]);
  const [podcastSubscribed, setPodcastSubscribed] = useState<number[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const rss = await allUserRSSSources(userId);
        const podcasts = await allUserPodcastSources(userId);

        setRssSubscribed(rss.map((s: any) => s.source_id));
        setPodcastSubscribed(podcasts.map((s: any) => s.source_id));
      } catch (err) {
        console.error("Failed to fetch user sources:", err);
      }
    }

    fetchData();
  }, [userId]);
  
  const handleAddSource = async (sourceId: number, feedType: "rss" | "podcast") => {
    try {
      await presetSources(userId, sourceId, feedType);
      toast.success(`${feedType === "podcast" ? "Podcast" : "Source"} added to your feed!`);
      if (feedType === "rss") {
        setRssSubscribed(prev => [...prev, sourceId]);
      } else {
        setPodcastSubscribed(prev => [...prev, sourceId]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add source. Please try again.");
    }
  };

   const filteredBlogSources = blogSources.filter(src => !rssSubscribed.includes(src.id));
  const filteredPodcastSources = podcastSources.filter(src => !podcastSubscribed.includes(src.id));

  const renderSources = (list: Source[], feedType: "rss" | "podcast") => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 mt-6">
      {list.map((src) => (
        <div
          key={src.id}
          className="border border-gray-300 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
        >
          <div className="flex justify-center mb-2">
            <span
              className={`text-[10px] font-semibold px-2 py-1 rounded-full ${categoryColors[src.category] || "bg-gray-100 text-gray-700"} uppercase`}
            >
              {src.category}
            </span>
          </div>
          <h3 className="font-semibold text-[var(--text)] mb-1 text-center">{src.name}</h3>
          <p className="text-xs text-gray-600 mb-3 text-center">{src.description}</p>
          <Button
            onClick={() => handleAddSource(src.id, feedType)}
            className="w-full text-xs mt-auto"
          >
            Add to Feed
          </Button>
        </div>
      ))}
    </div>
  );

  return (
    <section className="py-5 px-8 rounded-md mt-6">
      <div className="max-w-6xl mx-auto">

        {/* Blogs / Articles Section */}
        <h2 className="text-lg font-bold mb-3 text-[var(--text)]">📰 Blogs / Articles</h2>
        {filteredBlogSources.length === 0 ? (
          <p className="text-gray-500 text-sm">No more sources available.</p>
        ) : (
          renderSources(filteredBlogSources, "rss")
        )}

        <div className="my-10 border-t border-gray-300"></div>

        {/* Podcasts Section */}
        <h2 className="text-lg font-bold mb-3 text-[var(--text)]">🎧 Podcasts</h2>
        {filteredPodcastSources.length === 0 ? (
          <p className="text-gray-500 text-sm">No more podcasts available.</p>
        ) : (
          renderSources(filteredPodcastSources, "podcast")
        )}
      </div>
    </section>
  );
};


export default Sites;






// import React from "react";
// import { Button } from "@/components/ui/button";
// import { presetSources } from "@/services/api";
// import { toast } from "sonner"; 

// interface Source {
//   id: number;
//   name: string;
//   description: string;
//   category: string;
// }

// const sources: Source[] = [
//   { id: 3, name: "The Hindu", description: "In-depth Indian news and analysis.", category: "News" },
//   { id: 8, name: "Indian Express", description: "Trusted Indian journalism and editorials.", category: "News" },
//   { id: 27, name: "Bollywood Hungama", description: "Latest Bollywood news and film updates.", category: "Entertainment" },
//   { id: 18, name: "Vogue India", description: "Fashion, lifestyle, and beauty trends from India.", category: "Lifestyle" },
//   { id: 19, name: "Harper’s Bazaar", description: "Luxury fashion and culture magazine.", category: "Lifestyle" },
//   { id: 25, name: "Eric Kim Blog", description: "Street photography essays and visual philosophy.", category: "Photography" },
//   { id: 21, name: "Serious Eats", description: "Science-based cooking and recipe insights.", category: "Food" },
//   { id: 22, name: "Cal Newport", description: "Deep work, focus, and productivity writing.", category: "Productivity" },
//   { id: 26, name: "Stratechery", description: "Smart analysis of tech business and strategy.", category: "Tech" },
//   { id: 29, name: "The Guardian", description: "Independent journalism covering world news and politics around the globe.", category: "News" },
//   { id: 30, name: "Deccan Herald", description:  "Indian news source featuring national, international, and regional updates.", category: "News" },
//   { id: 31, name: "WIRED", description: "In-depth reporting on technology, culture, science, and the future of innovation.", category: "Tech" },
//   { id: 37, name: "Aeon", description: "Thoughtful essays on philosophy, culture, and the human experience.", category: "Culture" },
//   { id: 39, name: "CNN", description: "Global breaking news and analysis covering politics, business, and current affairs.", category: "News" },
//   { id: 40, name: "Naukri Blog", description:"Career advice, job search tips, and professional growth insights from Naukri.com.", category: "Career" },
// ];

// // category → color mapping
// const categoryColors: Record<string, string> = {
//   News: "bg-blue-100 text-blue-700",
//   Entertainment: "bg-pink-100 text-pink-700",
//   Business: "bg-amber-100 text-amber-700",
//   Lifestyle: "bg-purple-100 text-purple-700",
//   Photography: "bg-green-100 text-green-700",
//   Food: "bg-orange-100 text-orange-700",
//   Productivity: "bg-teal-100 text-teal-700",
//   Tech: "bg-sky-100 text-sky-700",
// };

// export const Sites: React.FC<{ userId: number }> = ({ userId }) => {
//   const handleAddSource = async (sourceId: number) => {
//     console.log("Adding source:", { userId, sourceId });
//     try {
//       await presetSources(userId, sourceId);
//       toast.success("✅ Source added to your feed!");
//     } catch (err) {
//       console.error(err);
//       toast.error("❌ Failed to add source. Please try again.");
//     }
//   };

//   return (
//     <section className="py-5 px-8 rounded-md mt-6">
//       <div className="max-w-6xl mx-auto">
//         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8">
//           {sources.map((src) => (
//             <div
//               key={src.id}
//               className="border border-gray-300 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
//             >
//               {/* Category tag */}
//               <div className="flex justify-center mb-2">
//                 <span
//                   className={`text-[10px] font-semibold px-2 py-1 rounded-full ${categoryColors[src.category]} uppercase`}
//                 >
//                   {src.category}
//                 </span>
//               </div>

//               <h3 className="font-semibold text-[var(--text)] mb-1 text-center">
//                 {src.name}
//               </h3>

//               <p className="text-xs text-gray-600 mb-3 text-center">
//                 {src.description}
//               </p>

//               <Button
//                 onClick={() => handleAddSource(src.id)}
//                 className="w-full text-xs mt-auto"
//               >
//                 Add to Feed
//               </Button>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default Sites;













// import React from "react";
// import { Button } from "@/components/ui/button";
// import { presetSources } from "@/services/api";
// import { toast } from "sonner"; 

// interface Source {
//   id: number;
//   name: string;
//   description: string;
// }

// const sources: Source[] = [
//   { id: 3, name: "The Hindu", description: "In-depth Indian news and analysis." },
//   { id: 8, name: "Indian Express", description: "Trusted Indian journalism and editorials." },
//   { id: 27, name: "Bollywood Hungama", description: "Latest Bollywood news and film updates." },
//   { id: 17, name: "Business Insider", description: "Global business and tech insights." },
//   { id: 18, name: "Vogue India", description: "Fashion, lifestyle, and beauty trends from India." },
//   { id: 19, name: "Harper’s Bazaar", description: "Luxury fashion and culture magazine." },
//   { id: 25, name: "Eric Kim Blog", description: "Street photography essays and visual philosophy." },
//   { id: 21, name: "Serious Eats", description: "Science-based cooking and recipe insights." },
//   { id: 22, name: "Cal Newport", description: "Deep work, focus, and productivity writing." },
//   { id: 26, name: "Stratechery", description: "Smart analysis of tech business and strategy." },
// ];

// export const Sites: React.FC<{ userId: number }> = ({ userId }) => {
//   const handleAddSource = async (sourceId: number) => {
//     console.log("Adding source:", { userId, sourceId });
//     try {
//       await presetSources(userId, sourceId);
//       toast.success("✅ Source added to your feed!");
//       console.log("source added!")
//     } catch (err) {
//       console.error(err);
//       toast.error("❌ Failed to add source. Please try again.");
//     }
//   };

//   return (
//     <section className="py-10 px-8 bg-gray-50 mt-6">
//       <div className="max-w-6xl mx-auto">
//         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
//           {sources.map((src) => (
//             <div
//               key={src.id}
//               className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
//             >
//               <h3 className="font-semibold text-[var(--text)] mb-1 text-center">
//                 {src.name}
//               </h3>
//               <p className="text-xs text-gray-600 mb-3 text-center">
//                 {src.description}
//               </p>
//               <Button
//                 onClick={() => handleAddSource(src.id)}
//                 className="w-full text-xs"
//               >
//                 Add to Feed
//               </Button>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default Sites;




// import React from "react";

// interface Site {
//   logo: string;
//   name: string;
// }

// const sites: Site[] = [
//   { logo: "/f_logo.png", name: "Forbes" },
//   { logo: "/bbc_logo.png", name: "BBC" },
//   { logo: "/espn_logo.png", name: "ESPN" },
//   { logo: "/ndtv_logo.png", name: "NDTV" },
//   { logo: "/ht_logo.png", name: "The Hindustan Times" },
//   { logo: "/ng_logo.png", name: "National Geographic" },
//   { logo: "/hb_logo.png", name: "Harper's Bazaar" },
//   { logo: "/v_logo.png", name: "Vogue" },
//   { logo: "/toi_logo.png", name: "Times of India" },
//   { logo: "/it_logo.png", name: "India Today" },
//   { logo: "/cnn_logo.png", name: "CNN" },
//   { logo: "/tnyt_logo.png", name: "NY Times" },
//   { logo: "/bi_logo.png", name: "Business Insider" },
//   { logo: "/th_logo.png", name: "The Hindu" },   **
//   { logo: "/bf_logo.png", name: "BuzzFeed" },
//   { logo: "/ew_logo.png", name: "Economic Weekly" },
// ];


// export const Sites: React.FC = () => {
//   return (
//     <section className="py-8 px-8 bg-gray-50 mt-6 ml-0">
//       <div className="max-w-7xl mx-auto px-6 text-left">
//         <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-12 whitespace-nowrap items-center">
//           {sites.map((site, index) => (
//             <div key={index} className="flex flex-col items-center hover:scale-110 transition-transform duration-200">
//               <img
//                 src={site.logo}
//                 alt={site.name}
//                 className="h-10 w-auto object-contain mb-2"
//               />
//               <p className="text-sm text-grey-700 justify-center">{site.name}</p>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// };


// export default Sites;
