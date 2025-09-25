
import { motion } from "framer-motion";
import { SiteShowcase } from "./components/sites"
import { Benefits } from "./components/benefits"
import { ArticlesAnimation } from "./components/animations";





export default function App() {
  return (
    <div className="bg-base min-h-screen text-primary">
      {/* Navbar */}
      <header className="flex justify-between items-center px-8 py-6">
        <h1 className="text-2xl font-bold">ReadArchive</h1>
        <nav className="flex gap-6 items-center">
          <a href="#features" className="hover:text-secondary transition">Features</a>
          <a href="#contact" className="hover:text-secondary transition">Contact</a>
          <button className="px-5 py-2 rounded-xl bg-primary text-base hover:bg-secondary transition">
            Create Account
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="text-center px-6 mt-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl font-bold"
        >
          Build Your World of Ideas
        </motion.h2>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto whitespace-nowrap">
          ReadArchive brings the internet to you. Curate, filter, and organize content that matters <br />
          Powered by personalization, Built for focus
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-secondary transition">
            Create Account
          </button>
          <button className="px-6 py-3 bg-accent text-primary rounded-xl hover:bg-secondary hover:text-white transition">
            Sign In
          </button>
        </div>
      </section>

      <SiteShowcase />

      <div>
        <Benefits />
      </div>

      <div className="my-16">
        <ArticlesAnimation />
      </div>

      {/* Features Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <FeatureCard
          title="Powerful Filtering"
          desc="Show only what matters with custom keyword filters and source preferences."
          img="/placeholder_img.png"
          color="bg-red-50"
        />
        <FeatureCard
          title="Organized Reading"
          desc="Folders, read-later lists, and auto-archiving to keep your feed clean."
          img="/placeholder_img.png"
          color="bg-yellow-50"
        />
        <FeatureCard
          title="Smarter Summaries"
          desc="AI-powered summaries so you can grasp content quickly and efficiently."
          img="/placeholder_img.png"
          color="bg-blue-50"
        />
      </div>

      {/* How It Works */}
      <section className="mt-28 px-8 text-center">
        <h3 className="text-3xl font-bold mb-6">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          <Step number="1" title="Subscribe" desc="Add blogs, podcasts, and newsletters you love." />
          <Step number="2" title="Customize" desc="Set filters, sorting rules, and reading preferences." />
          <Step number="3" title="Read Smarter" desc="Enjoy AI summaries and distraction-free reading." />
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-24 py-8 text-center text-gray-500">
        © {new Date().getFullYear()} ReadArchive. All rights reserved.
      </footer>
    </div>


  );
}

// Feature Card Component (Notion-style)
function FeatureCard({
  title,
  desc,
  img,
  color,
}: {
  title: string
  desc: string
  img: string
  tag?: string
  color: string
}) {
  return (
    <motion.div
      // whileHover={{ scale: 1.02 }}
      className={`rounded-2xl p-6 text-left shadow-sm hover:shadow-md transition flex flex-col justify-between ${color}`}
    >

      {/* Title & Description */}
      <div>
        <h4 className="text-2xl font-semibold mb-3">{title}</h4>
        <p className="text-gray-700 mb-4">{desc}</p>
      </div>

      {/* Placeholder image */}
      <div className="bg-white rounded-lg overflow-hidden border">
        <img src={img} alt={title} className="w-full h-40 object-cover" />
      </div>
    </motion.div>
  )
}


// Step Component
function Step({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold">
        {number}
      </div>
      <h5 className="mt-4 text-xl font-semibold">{title}</h5>
      <p className="text-gray-600 mt-2 max-w-xs">{desc}</p>
    </div>
  );
}
