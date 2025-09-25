//do not use

import React from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";



interface Site {
  logo: string;
}

const sites: Site[] = [
  { logo: "/m_logo.png" },
  { logo: "/bbc_logo.png" },
  { logo: "/espn_logo.png" },
  { logo: "/ndtv_logo.png" },
  { logo: "/tie_logo.png" },
  { logo: "/ng_logo.png" },
  { logo: "/hb_logo.png" },
  { logo: "/v_logo.png" },
  { logo: "/toi_logo.png" },
  { logo: "/it_logo.png" },
  { logo: "/cnn_logo.png" },
  { logo: "/tnyt_logo.png" },
  { logo: "/bi_logo.png" },
  { logo: "/th_logo.png" },
  { logo: "/bf_logo.png" },
  { logo: "/ew_logo.png" },
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
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 12 } },
};

export const SiteShowcase: React.FC = () => {
  return (
    <section className="py-12 bg-gray-50 mt-20">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-12 mt-6">
          Explore Content From Multiple Sources
        </h2>

        <motion.div 
          className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 items-center justify-items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {sites.map((site, index) => (
            <motion.div
              key={index}
              className=" hover:scale-110"
              variants={itemVariants as Variants}
            >
              <img
                src={site.logo}
                alt={`Site ${index + 1}`}
                className="h-10 w-auto object-contain"
              />
            </motion.div>
          ))}
          <motion.p className="col-span-full mt-10 text-grey-500" variants={itemVariants as Variants}>And many more</motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default SiteShowcase;
