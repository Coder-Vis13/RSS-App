import { motion } from "framer-motion";

export function Benefits() {
  const values = [
    {
      title: "Streamlined Content Consumption",
      desc: "Access all your favorite media—articles, blogs, videos, and podcasts—in one centralized feed. No more hopping between apps or tabs.",
    },
    {
      title: "Gain Complete Control Over Your Feed",
      desc: "Cut out the noise. Apply custom keyword rules, sort by priorities, and create a highly personalized reading experience.",
    },
    {
      title: "Effortlessly Manage Your Content",
      desc: "Stay organized with powerful folders, automatic archiving, and a dedicated “Read Later” list to keep track of what matters next.",
    },
    {
      title: "Save Time and Read Smarter",
      desc: "Maximize your focus with estimated reading times, distraction-free full-text mode, and time-based snooze features to fit your schedule.",
    },
    {
      title: "Build a Consistent Reading Habit",
      desc: "Stay motivated with streak tracking and progress insights, turning daily reading into a rewarding habit.",
    },
  ];

  return (
    <section className="mt-28 px-8 text-center">
      {/* Tagline */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-3xl md:text-4xl font-bold mb-12 bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent"
      >
        Turn scattered sources into your personal library
      </motion.h2>

      

      {/* Values grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto text-left">
        {values.map((v, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="bg-neutralLight rounded-2xl p-6 shadow-sm hover:shadow-md transition"
          >
            <h3 className="text-xl font-semibold mb-3">{v.title}</h3>
            <p className="text-gray-700">{v.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
