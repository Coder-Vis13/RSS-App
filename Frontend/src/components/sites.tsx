import React from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

interface Site {
  logo: string;
}

const sites: Site[] = [
  { logo: "/dh_logo.png"},
  { logo: "/ndtv_logo.png"},
  { logo: "/tie_logo.png"},
  { logo: "/hb_logo.png" },
  { logo: "/v_logo.png"},
  { logo: "/toi_logo.png"},
  { logo: "/tnyt_logo.png"},
  { logo: "/th_logo.png" },
  { logo: "/cnn_logo.png" },
  { logo: "/yt_logo.png"},
  { logo: "/ap_logo.jpg" },
  { logo: "/r_logo.png" },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05, // delay between each icon
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 12 },
  },
};

export const SiteShowcase: React.FC = () => {
  return (
    <section>
      <div className="max-w-6xl mx-auto">
    <div className="flex items-center gap-4 mb-6">
      <div className="h-px flex-1 bg-gray-200" />
      <span className="text-xs font-medium tracking-[0.2em] text-gray-400">
        Works with your favorite sources
      </span>
      <div className="h-px flex-1 bg-gray-200" />
    </div>

        <motion.div
          className="grid grid-cols-6 gap-y-6 items-center justify-items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {sites.map((site, index) => (
            <motion.div
              key={index}
              variants={itemVariants as Variants}
              className="flex items-center justify-center"
            >
              <img
                src={site.logo}
                className="h-9 w-auto object-contain"
              />
            </motion.div>
          ))}

          
        </motion.div>
      </div>
    </section>
  );
};

export default SiteShowcase;
