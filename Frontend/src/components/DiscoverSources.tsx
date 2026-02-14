import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { presetSources } from "@/services/user.service";
import { toast } from "sonner";
import {
  allUserRSSSources,
  allUserPodcastSources,
} from "../services/user.service";

interface Source {
  id: number;
  name: string;
  description: string;
  category: string;
  domain: string;
}

const getFaviconUrl = (domain: string, size = 120) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;

const getLogoUrl = (domain: string) => `https://logos.hunter.io/${domain}`;

const blogSources: Source[] = [
  {
    id: 11,
    name: "The Hindu",
    description: "In-depth Indian news and analysis.",
    category: "News",
    domain: "thehindu.com",
  },
  {
    id: 12,
    name: "Indian Express",
    description: "Trusted Indian journalism and editorials.",
    category: "News",
    domain: "indianexpress.com",
  },
  {
    id: 5,
    name: "NDTV",
    description: "Global breaking news and current affairs.",
    category: "News",
    domain: "ndtv.com",
  },
  {
    id: 10,
    name: "Times of India",
    description: "Breaking news and top stories from India.",
    category: "News",
    domain: "indiatimes.com",
  },
  {
    id: 14,
    name: "News18",
    description: "Indian and global news coverage.",
    category: "News",
    domain: "news18.com",
  },
  {
    id: 15,
    name: "Bollywood Hungama",
    description: "Latest Bollywood news and updates.",
    category: "Entertainment",
    domain: "bollywoodhungama.com",
  },
  {
    id: 13,
    name: "Fossbytes",
    description: "Technology news, explainers, and guides.",
    category: "Tech",
    domain: "fossbytes.com",
  },
  {
    id: 16,
    name: "Techrytr",
    description: "Tech news, reviews, and digital trends.",
    category: "Tech",
    domain: "techrytr.in",
  },
  {
    id: 9,
    name: "Figma Blog",
    description: "Design, product, and collaboration insights.",
    category: "Design",
    domain: "figma.com",
  },
  {
    id: 17,
    name: "TV9 Kannada",
    description: "Kannada-language regional news coverage.",
    category: "Regional News",
    domain: "tv9kannada.com",
  },
  {
    id: 19,
    name: "BuzzFeed",
    description: "Trending news, culture, and entertainment.",
    category: "Entertainment",
    domain: "buzzfeed.com",
  },
];

const podcastSources: Source[] = [
  {
    id: 53,
    name: "This Past Weekend",
    description: "Theo Von's comedic conversations.",
    category: "Entertainment",
    domain: "theovon.com",
  },
  {
    id: 54,
    name: "The Joe Rogan Experience",
    description: "Long-form conversations with diverse guests.",
    category: "Culture",
    domain: "joerogan.com",
  },
  {
    id: 55,
    name: "Call Her Daddy",
    description: "Modern relationships and pop culture.",
    category: "Lifestyle",
    domain: "callherdaddy.com",
  },
  {
    id: 56,
    name: "The Tucker Carlson Show",
    description: "Political and cultural commentary.",
    category: "News",
    domain: "tuckercarlson.com",
  },
  {
    id: 57,
    name: "Good Hang",
    description: "Funny, thoughtful guest chats.",
    category: "Entertainment",
    domain: "earwolf.com",
  },
  {
    id: 58,
    name: "The Diary of a CEO",
    description: "Leadership and personal journeys.",
    category: "Business",
    domain: "stevenbartlett.com",
  },
  {
    id: 59,
    name: "The Mel Robbins Podcast",
    description: "Mindset and motivation advice.",
    category: "Productivity",
    domain: "melrobbins.com",
  },
  {
    id: 60,
    name: "Huberman Lab",
    description: "Neuroscience-backed self improvement.",
    category: "Health",
    domain: "hubermanlab.com",
  },
  {
    id: 61,
    name: "The Sadhguru Podcast",
    description: "Spiritual wisdom and well-being.",
    category: "Spirituality",
    domain: "isha.sadhguru.org",
  },
  {
    id: 62,
    name: "Gita For Daily Living",
    description: "Bhagavad Gita applied to life.",
    category: "Spirituality",
    domain: "gitafordailyliving.com",
  },
  {
    id: 63,
    name: "The Daily Brief",
    description: "Concise daily news updates.",
    category: "News",
    domain: "dailybrief.indiatoday.in",
  },
  {
    id: 64,
    name: "WTF is with Nikhil Kamath",
    description: "Business, investing, and life.",
    category: "Finance",
    domain: "zerodha.com",
  },
];

/*Category colours */

const categoryColors: Record<string, string> = {
  News: "bg-blue-50 text-blue-600",
  Tech: "bg-sky-50 text-sky-600",
  Productivity: "bg-teal-50 text-teal-600",
  Lifestyle: "bg-purple-50 text-purple-600",
  Food: "bg-orange-50 text-orange-600",
  Photography: "bg-green-50 text-green-600",
  Entertainment: "bg-pink-50 text-pink-600",
  Culture: "bg-indigo-50 text-indigo-600",
  Business: "bg-amber-50 text-amber-600",
  Health: "bg-emerald-50 text-emerald-600",
  Spirituality: "bg-yellow-50 text-yellow-600",
  Finance: "bg-gray-50 text-gray-600",
};

export const Sites: React.FC<{ userId: number }> = ({ userId }) => {
  const [rssSubscribed, setRssSubscribed] = useState<number[]>([]);
  const [podcastSubscribed, setPodcastSubscribed] = useState<number[]>([]);

  useEffect(() => {
    async function fetchData() {
      const rss = await allUserRSSSources(userId);
      const podcasts = await allUserPodcastSources(userId);
      setRssSubscribed(rss.map((s: any) => s.source_id));
      setPodcastSubscribed(podcasts.map((s: any) => s.source_id));
    }
    fetchData();
  }, [userId]);

  const handleAddSource = async (
    sourceId: number,
    feedType: "rss" | "podcast",
  ) => {
    try {
      await presetSources(userId, sourceId, feedType);
      toast.success("Added to feed");
      feedType === "rss"
        ? setRssSubscribed((p) => [...p, sourceId])
        : setPodcastSubscribed((p) => [...p, sourceId]);
    } catch {
      toast.error("Failed to add source");
    }
  };

  const renderSources = (list: Source[], feedType: "rss" | "podcast") => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-10">
      {list.map((src) => (
        <div
          key={src.id}
          className="group relative rounded-2xl bg-white p-6 flex flex-col transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-gray-200 focus-within:ring-offset-2"
          style={{
            boxShadow:
              "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.04)",
          }}
        >
          {/* Top row */}
          <div className="flex items-start justify-between mb-5">
            <div className="relative">
              <img
                src={getLogoUrl(src.domain)}
                onError={(e) => {
                  e.currentTarget.src = getFaviconUrl(src.domain, 128);
                }}
                alt={`${src.name} logo`}
                className="w-12 h-12 rounded-xl transition-transform duration-300 group-hover:scale-105"
                style={{
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                }}
              />
            </div>

            <span
              className={`text-[10px] font-medium px-2.5 py-1 rounded-full tracking-wide ${
                categoryColors[src.category] || "bg-gray-50 text-gray-600"
              }`}
            >
              {src.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-[15px] font-semibold text-gray-900 leading-snug mb-2 tracking-tight">
            {src.name}
          </h3>

          {/* Description */}
          <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2 min-h-[3rem] mb-6 flex-grow">
            {src.description}
          </p>

          {/* CTA */}
          <Button
            size="sm"
            variant="outline"
            className="
            mt-auto w-full
            h-9
            rounded-xl
            border-gray-200
            bg-white
            text-[13px] font-medium text-gray-700
            hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900
            active:bg-gray-100 active:scale-[0.98]
            transition-all duration-200 ease-out
            focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-1
          "
            onClick={() => handleAddSource(src.id, feedType)}
          >
            Add to feed
          </Button>
        </div>
      ))}
    </div>
  );

  return (
    <section className="px-6 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto space-y-16 sm:space-y-20 lg:space-y-24">
        {/* Blogs */}
        <div>
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3 tracking-tight">
              Blogs & Articles
            </h2>
            <p className="text-[15px] text-gray-500 max-w-2xl leading-relaxed">
              Curated writing from high-quality publications and independent
              thinkers.
            </p>
          </div>

          {renderSources(
            blogSources.filter((s) => !rssSubscribed.includes(s.id)),
            "rss",
          )}
        </div>

        {/* Podcasts */}
        <div>
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3 tracking-tight">
              Podcasts
            </h2>
            <p className="text-[15px] text-gray-500 max-w-2xl leading-relaxed">
              Long-form conversations and daily audio briefings.
            </p>
          </div>

          {renderSources(
            podcastSources.filter((s) => !podcastSubscribed.includes(s.id)),
            "podcast",
          )}
        </div>
      </div>
    </section>
  );
};

export default Sites;
