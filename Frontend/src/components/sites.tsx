import React from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

interface Site {
  logo: string;
  name: string;
}

const sites: Site[] = [
  { logo: "/a_logo.jpg", name: "Aeon" },
  { logo: "/dh_logo.png", name: "Deccan Herald" },
  { logo: "/ndtv_logo.png", name: "NDTV" },
  { logo: "/tie_logo.png", name: "The Indian Express" },
  { logo: "/hb_logo.png", name: "Harper's Bazaar" },
  { logo: "/v_logo.png", name: "Vogue" },
  { logo: "/toi_logo.png", name: "TOI" },
  { logo: "/tnyt_logo.png", name: "The New York Times" },
  { logo: "/th_logo.png", name: "The Hindu" },
  { logo: "/se_logo.png", name: "Serious Eats" },
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
    <section className="mb-1">
      <div className="py-6 max-w-6xl mx-auto text-center rounded-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-12">
          Explore Content From Multiple Sources
        </h2>

        <motion.div
          className="grid grid-cols-5 gap-6 items-center justify-items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {sites.map((site, index) => (
            <motion.div
              key={index}
              variants={itemVariants as Variants}
              className="flex flex-col items-center"
            >
              <img
                src={site.logo}
                alt={site.name}
                className="h-10 w-auto object-contain"
              />
              <span className="text-sm text-gray-500 mt-2">{site.name}</span>
            </motion.div>
          ))}

          <motion.p
            className="col-span-full mt-10 text-gray-500"
            variants={itemVariants as Variants}
          >
            and many more
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default SiteShowcase;
