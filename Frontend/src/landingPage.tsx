
import { motion } from "framer-motion";
import { SiteShowcase } from "./components/sites";
// import { Benefits } from "./components/benefits"
import { Button } from "./components/ui/button";
import { Sparkles, FolderOpen, Crosshair, Clock, ArrowUp, Filter, Bookmark } from "lucide-react";
//import { signUp, signIn, signOut } from "./auth";
import { useState } from "react";
//import { supabase } from "./lib/supabase";
// import { addUser } from "./services/api";

export default function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<any>(null);
  // const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);

  async function handleAuth() {
    // Supabase removed — mock successful auth
    const mockUser = { email };

    setUser(mockUser);
    localStorage.setItem("mock_user_email", email);

    setShowAuthModal(false);
    window.location.href = "/home";
  }

    function handleFinishOnboarding() {
    if (!name.trim()) {
      alert("Please enter your name to continue.");
      return;
    }

    // Store name for UI purposes
    localStorage.setItem("user_name", name);

    setShowOnboarding(false);

    // Navigate to home page
    window.location.href = "/home";
  }

  async function handleLogout() {
    // Supabase removed — mock logout
    setUser(null);
    localStorage.removeItem("mock_user_email");
  }

  return (
    <div className="bg-base min-h-screen text-primary relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-[var(--navyblue)]/10 blur-3xl" />
        <div className="absolute -top-56 right-[-12rem] h-[620px] w-[620px] rounded-full bg-[var(--skyblue)]/55 blur-3xl" />
        <div className="absolute top-[28rem] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[var(--navyblue)]/5 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 1) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
      </div>
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-[var(--navyblue)]">
            ReadArchive
          </h1>
          <nav className="flex items-center gap-5 sm:gap-6">
            <a
              href="#features"
              className="text-sm font-medium text-gray-600 hover:text-[var(--navyblue)] transition-colors"
            >
            Features
            </a>
            

          {!user ? (
              <>
                <button
                  onClick={() => {
                    setMode("signup");
                    setShowAuthModal(true);
                  }}
                  className="rounded-xl bg-[var(--navyblue)] px-4 py-2 text-sm font-medium text-[var(--beige)] shadow-sm"
                >
                  Create Account
                </button>

                <button
                  onClick={() => {
                    setMode("login");
                    setShowAuthModal(true);
                  }}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[var(--navyblue)] shadow-sm"
                >
                  Sign In
                </button>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm"
              >
                Log Out
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-6xl px-5 pt-14 pb-12 sm:px-8 sm:pt-18 sm:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] items-center gap-10 lg:gap-14">
          <div className="text-center lg:text-left">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[var(--navyblue)]"
            >
              Build Your World of Ideas
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
              className="mx-auto lg:mx-0 mt-5 max-w-2xl text-[15px] sm:text-base leading-relaxed text-gray-600"
            >
              ReadArchive brings the internet to you. Curate, filter, and organize content that matters.
              <span className="hidden sm:inline"> </span>
              <span className="block sm:inline">Powered by personalization, built for focus.</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
              className="mt-8 flex flex-col sm:flex-row justify-center lg:justify-start gap-3 sm:gap-4"
            >
              <Button
                onClick={() => {
                  setMode("signup");
                  setShowAuthModal(true);
                }}
                className="h-11 rounded-2xl px-6 text-sm font-medium shadow-sm"
              >
                Create Account
              </Button>
              <Button
                onClick={() => {
                  setMode("login");
                  setShowAuthModal(true);
                }}
                variant="outline"
                className="h-11 rounded-2xl px-6 text-sm font-medium border-black/10 text-[var(--navyblue)] hover:bg-black/5 shadow-sm"
              >
                Sign In
              </Button>
            </motion.div>
          </div>

          {/* Visual accent card (no new text, purely decorative) */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.05 }}
            className="relative mx-auto w-full max-w-[420px] lg:max-w-none"
          >
            <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-white/70 backdrop-blur shadow-[0_20px_80px_-40px_rgba(47,65,86,0.55)]">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--navyblue)]/8 via-transparent to-[var(--skyblue)]/50" />
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-20 rounded-full bg-black/10" />
                  <div className="flex gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-black/10" />
                    <div className="h-2.5 w-2.5 rounded-full bg-black/10" />
                    <div className="h-2.5 w-2.5 rounded-full bg-black/10" />
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/80 border border-black/5 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="grid place-items-center h-10 w-10 rounded-2xl bg-[var(--navyblue)]/10">
                        <Crosshair className="h-5 w-5 text-[var(--navyblue)]" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-2.5 w-24 rounded-full bg-black/10" />
                        <div className="h-2.5 w-16 rounded-full bg-black/10" />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/80 border border-black/5 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="grid place-items-center h-10 w-10 rounded-2xl bg-[var(--navyblue)]/10">
                        <FolderOpen className="h-5 w-5 text-[var(--navyblue)]" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-2.5 w-20 rounded-full bg-black/10" />
                        <div className="h-2.5 w-28 rounded-full bg-black/10" />
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 rounded-2xl bg-white/80 border border-black/5 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="grid place-items-center h-10 w-10 rounded-2xl bg-[var(--navyblue)]/10">
                        <Filter className="h-5 w-5 text-[var(--navyblue)]" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="h-2.5 w-40 rounded-full bg-black/10" />
                        <div className="h-2.5 w-56 rounded-full bg-black/10" />
                      </div>
                      <div className="h-6 w-16 rounded-full bg-[var(--navyblue)]/10" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-black/5 bg-white/60 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-[var(--navyblue)]/30" />
                      <div className="h-2.5 w-2.5 rounded-full bg-[var(--navyblue)]/20" />
                      <div className="h-2.5 w-2.5 rounded-full bg-[var(--navyblue)]/10" />
                    </div>
                    <Sparkles className="h-4 w-4 text-[var(--navyblue)]/50" />
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -inset-8 -z-10 rounded-[2.25rem] bg-[var(--navyblue)]/5 blur-2xl" />
          </motion.div>
        </div>
      </section>

      {/* Site Showcase */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-white/60 backdrop-blur shadow-sm">
{/* Top gradient */}
<div
  aria-hidden
  className="pointer-events-none absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[var(--skyblue)]/40 to-transparent"
/>

{/* Bottom gradient */}
<div
  aria-hidden
  className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--skyblue)]/40 to-transparent"
/>
          <div className="relative p-6 sm:p-8">
            <SiteShowcase />
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section id="features" className="mx-auto mt-16 max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-md font-semibold tracking-wide text-gray-500">Built for you</p>
          <h3 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--navyblue)]">
            A calmer way to consume content
          </h3>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <FeatureCard
            title="Stay Focused"
            desc="You decide what deserves your attention. Cut through the chaos of the internet and reveal only the content worth your attention. With intelligent filtering and a feed shaped entirely around your interests, ReadArchive transforms your reading into a focused, distraction-free space built specifically for you."
            color="bg-[#F0F7FF]"
            icon={Crosshair}
          />
          <FeatureCard
            title="Organize Effortlessly"
            desc="Take charge of your reading. Transform scattered content into a clear, organized system. With customizable folders, smart sorting, and effortless saving, ReadArchive helps you build the perfect structure for your ideas—everything in one place, exactly how you want it."
            color="bg-[#F0F7FF]"
            icon={FolderOpen}
          />
        </div>
        <div className="mt-6">
          <FeatureCard
            title="Cut through the clutter"
            desc="Categorized content at your fingertips, minus the distractions. Find what matters instantly. ReadArchive organizes your content into clean, intuitive categories, separating meaningful insights from the constant noise of the internet. With precise filters, distraction blocking, and smart prioritization, you can surface the articles and podcasts that align with your interests in seconds—no endless scrolling, no wasted time. Just a clear, focused reading experience shaped entirely around what you care about."
            color="bg-[#F0F7FF]"
            icon={Sparkles}
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto mt-16 max-w-6xl px-5 sm:px-8">
        <div className="rounded-3xl bg-[var(--navyblue)] px-6 py-14 sm:px-12">
          <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center text-[var(--beige)]">
            How It Works
          </h3>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto text-[var(--beige)]">
            <Step
              number="1"
              title="Bring your favourite content together"
              desc="Add your favourite news channels, articles, blogs, and podcasts."
            />
            <Step
              number="2"
              title="Personalize your feed"
              desc="Create folders, sort your sources by priority, and save your favourite articles"
            />
            <Step
              number="3"
              title="Read what you love"
              desc="Filter articles by category and enjoy your personalised reading zone."
            />
          </div>
        </div>
      </section>


      {/* Feed Transparency Section */}
      <section className="mt-20 max-w-6xl mx-auto px-5 sm:px-8">
        <div className="rounded-3xl bg-[#F0F7FF] px-6 py-14 sm:px-10">
          <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center text-[var(--navyblue)]">
            How Your Feed Is Generated
          </h3>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-3 mb-3">
        <FolderOpen className="w-6 h-6 text-[var(--navyblue)]" />
        <h4 className="text-xl font-semibold text-[var(--navyblue)]">Adding Your Sources</h4>
      </div>
      <p className="text-gray-700">
        Add any website or blog using its link. The app
        fetches the articles/blogs/podcasts published in the past 2 days so that you can stay connected to your favourite content.
      </p>
    </div>

            <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-3 mb-3">
        <Clock className="w-6 h-6 text-[var(--navyblue)]" />
        <h4 className="text-xl font-semibold text-[var(--navyblue)]">Automatic Refresh</h4>
      </div>
      <p className="text-gray-700">
        Every 2 hours,the app checks all your sources and pulls
        newly published articles/podcasts.
      </p>
    </div>

            <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-3 mb-3">
        <ArrowUp className="w-6 h-6 text-[var(--navyblue)]" />
        <h4 className="text-xl font-semibold text-[var(--navyblue)]">Sorting & Priority</h4>
      </div>
      <p className="text-gray-700">
        You control the order of your sources. Higher-priority sources appear
        earlier in your feed. Articles/podcasts inside each source are always sorted
        from newest to oldest.
      </p>
    </div>

            <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
        <Filter className="w-6 h-6 text-[var(--navyblue)]" />
        <h4 className="text-xl font-semibold text-[var(--navyblue)]">Categories & Filters</h4>
      </div>
      <p className="text-gray-700">
        Articles are automatically categorized. Filter
        your feed by topics like tech, business, news, or lifestyle to find what you love.
      </p>
    </div>

            <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all duration-300">
  <div className="flex items-center gap-3 mb-3">
        <Bookmark className="w-6 h-6 text-[var(--navyblue)]" />
        <h4 className="text-xl font-semibold text-[var(--navyblue)]">Saved Articles</h4>
      </div>
      <p className="text-gray-700">
        Organize your content into custom folders and save anything you love. Saved items never disappear.
      </p>
    </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="mt-16 py-10 text-center text-sm text-gray-500">
        {/* © {new Date().getFullYear()} ReadArchive. All rights reserved. */}
      </footer>
{/* Authentication Modal */}
{showAuthModal && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
    <div className="bg-white p-8 rounded-3xl shadow-2xl w-[420px] max-w-full border border-black/5">
      <h2 className="text-2xl font-bold mb-2 text-center">
        {mode === "signup" ? "Create Account" : "Sign In"}
      </h2>

      <p className="text-gray-600 text-center mb-6">
        {mode === "signup"
          ? "Start your journey with ReadArchive. Sign up to organize, filter, and access content that matters to you."
          : "Welcome back! Access your personalized feed and continue where you left off."}
      </p>

<div className="flex flex-col gap-5">
  {/* Email Field */}
  <div className="flex flex-col">
    <label className="mb-2 text-sm text-gray-500 font-medium">
      Enter your email address
    </label>
    <input
      type="email"
      className="w-full p-4 border border-black/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--navyblue)]/30 focus:border-[var(--navyblue)]/30"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      required
      autoComplete="new-email"  // Prevent autofill
    />
  </div>

  {/* Password Field */}
  <div className="flex flex-col">
    <label className="mb-2 text-sm text-gray-500 font-medium">
      {mode === "signup" ? "Create a secure password" : "Enter your password"}
    </label>
    <input
      type="password"
      className="w-full p-4 border border-black/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--navyblue)]/30 focus:border-[var(--navyblue)]/30"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      required
      autoComplete="new-password"  // Prevent autofill
    />
  </div>
</div>





      <Button className="w-full mt-6 h-11 rounded-2xl" onClick={handleAuth}>
        {mode === "signup" ? "Create Account" : "Sign In"}
      </Button>

      {/* {mode === "login" && (
        <p className="text-sm text-gray-500 text-center mt-2">
          Forgot your password? You can reset it anytime.
        </p>
      )} */}

      <p className="text-sm text-center mt-4 text-gray-600">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <span
              className="text-[var(--navyblue)] underline underline-offset-4 cursor-pointer"
              onClick={() => setMode("login")}
            >
              Sign In
            </span>
          </>
        ) : (
          <>
            Don’t have an account?{" "}
            <span
              className="text-[var(--navyblue)] underline underline-offset-4 cursor-pointer"
              onClick={() => setMode("signup")}
            >
              Create Account
            </span>
          </>
        )}
      </p>

      <button
        className="mt-5 w-full text-sm text-gray-500 hover:text-gray-900 transition-colors"
        onClick={() => setShowAuthModal(false)}
      >
        Cancel
      </button>
    </div>
  </div>
)}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-[420px] max-w-full text-center border border-black/5">
            <h2 className="text-2xl font-bold mb-3 text-[var(--navyblue)]">Welcome to ReadArchive</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Let’s personalize your experience. Please tell us your name.
            </p>
            <input
              type="text"
              placeholder="Your name"
              className="w-full p-4 border border-black/10 rounded-2xl mb-6 text-center focus:outline-none focus:ring-2 focus:ring-[var(--navyblue)]/30 focus:border-[var(--navyblue)]/30"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button className="w-full mb-3 h-11 rounded-2xl" onClick={handleFinishOnboarding}>
              Continue
            </Button>
            <button
              className="w-full text-sm text-gray-500 hover:text-gray-900 transition-colors"
              onClick={handleFinishOnboarding}
            >
              Skip for now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


// Feature Card Component
function FeatureCard({
  title,
  desc,
  color,
  icon: Icon,
}: {
  title: string;
  desc: string;
  tag?: string;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`group relative overflow-hidden rounded-3xl p-7 text-left border border-black/5 shadow-sm hover:shadow-md transition-shadow ${color}`}
    >
      <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-white/35 via-transparent to-transparent opacity-70" />

      <div className="relative flex items-center gap-3 mb-3">
        {Icon && (
          <div className="grid place-items-center h-12 w-12 rounded-2xl bg-white/75 border border-black/5 shadow-sm">
            <Icon className="w-6 h-6 text-[var(--navyblue)]" />
          </div>
        )}
        <h4 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--navyblue)]">
          {title}
        </h4>
      </div>
      <p className="relative text-[15px] leading-relaxed text-gray-700">{desc}</p>

      <div
        aria-hidden
        className="absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-[var(--navyblue)]/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      />
    </motion.div>
  );
}

// Step Component
function Step({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center text-inherit max-w-[220px] mx-auto">
      <div className="w-12 h-12 rounded-full bg-white/10 ring-1 ring-white/15 flex items-center justify-center text-2xl font-semibold">
        {number}
      </div>
      <h5 className="mt-4 text-base font-semibold tracking-tight">{title}</h5>
      <p className="text-[var(--beige)]/90 mt-2 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
















// import { motion } from "framer-motion";
// import { SiteShowcase } from "./components/sites";
// import { Button } from "./components/ui/button";
// import { Sparkles, FolderOpen, Crosshair } from "lucide-react";
// import { signUp, signIn, signOut } from "./auth";
// import { useState } from "react";
// import { addUser } from "./services/api";

// export default function Landing() {
//   const [showAuthModal, setShowAuthModal] = useState(false);
//   const [mode, setMode] = useState<"login" | "signup">("signup");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [user, setUser] = useState<{ id: string; email: string } | null>(null);

//   // SIGNUP / LOGIN HANDLER
//   async function handleAuth() {
//     if (mode === "signup") {
//       const { data, error } = await signUp(email, password);
//       if (error) return alert(error);

//       if (data.user) {
//         await addUser(data.user.email!, data.user.id);
//         setUser({ id: data.user.id, email: data.user.email! });
//       }

//       alert("Account created!");
//       setShowAuthModal(false);
//       return;
//     }

//     if (mode === "login") {
//       const { data, error } = await signIn(email, password);
//       if (error) return alert(error);

//       if (!data.user) return alert("Login failed");

//       await addUser(data.user.email!, data.user.id);
//       setUser({ id: data.user.id, email: data.user.email! });
//       localStorage.setItem("user_id", data.user.id);

//       setShowAuthModal(false);
//       window.location.href = "/home";
//     }
//   }

//   // LOGOUT HANDLER
//   async function handleLogout() {
//     await signOut();
//     localStorage.removeItem("user_id");
//     setUser(null);
//     window.location.href = "/";
//   }

//   return (
//     <div className="bg-base min-h-screen text-primary font-sans mt-5">
//       {/* Navbar */}
//       <header className="flex justify-between items-center px-8 py-6">
//         <h1 className="text-2xl font-bold">ReadArchive</h1>

//         <nav className="flex gap-6 items-center">
//           <a href="#features" className="hover:text-[var(--navyblue)]">Features</a>
//           <a href="#contact" className="hover:text-[var(--navyblue)]">Contact</a>

//           {!user ? (
//             <>
//               <button
//                 onClick={() => { setMode("signup"); setShowAuthModal(true); }}
//                 className="px-5 py-2 rounded-xl bg-primary hover:bg-secondary transition"
//               >
//                 Create Account
//               </button>

//               <button
//                 onClick={() => { setMode("login"); setShowAuthModal(true); }}
//                 className="px-5 py-2 rounded-xl border border-primary hover:bg-primary transition"
//               >
//                 Sign In
//               </button>
//             </>
//           ) : (
//             <button
//               onClick={handleLogout}
//               className="px-5 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition"
//             >
//               Log Out
//             </button>
//           )}
//         </nav>
//       </header>

//       {/* Hero Section */}
//       <section className="text-center px-6 mt-16">
//         <motion.h2
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6 }}
//           className="text-5xl font-bold"
//         >
//           Build Your World of Ideas
//         </motion.h2>

//         <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
//           ReadArchive brings the internet to you. Curate, filter, and organize content that matters.<br />
//           Powered by personalization, Built for focus
//         </p>

//         <div className="mt-8 flex justify-center gap-4 flex-wrap">
//           <Button onClick={() => { setMode("signup"); setShowAuthModal(true); }}>
//             Create Account
//           </Button>

//           <Button onClick={() => { setMode("login"); setShowAuthModal(true); }}>
//             Sign In
//           </Button>
//         </div>
//       </section>

//       {/* Site Showcase */}
//       <SiteShowcase />

//       {/* Features Section */}
//       <section className="mt-20">
//         <p className="text-center font-bold text-3xl text-[var(--navyblue)]">Built for you to</p>

//         <div className="mt-10 max-w-6xl mx-auto grid gap-6 md:grid-cols-3 px-4">
//           <FeatureCard title="Stay Focused" desc="You decide what deserves your attention. Cut through the chaos..." color="bg-[#F0F7FF]" icon={Crosshair} />
//           <FeatureCard title="Organize Effortlessly" desc="Transform scattered content into a clear, organized system..." color="bg-[#F0F7FF]" icon={FolderOpen} />
//           <FeatureCard title="Cut through the clutter" desc="ReadArchive organizes your content into clean, intuitive categories..." color="bg-[#F0F7FF]" icon={Sparkles} />
//         </div>
//       </section>

//       {/* How It Works */}
//       <section className="mt-20 rounded-lg text-center mb-20">
//         <div className="max-w-6xl mx-auto p-14 rounded-lg bg-[var(--navyblue)]">
//           <h3 className="text-3xl font-bold mb-10 text-[var(--beige)]">How It Works</h3>
//           <div className="grid grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto text-[var(--beige)] gap-10">
//             <Step number="1" title="Bring your favourite content together" desc="Add news channels, blogs, podcasts." />
//             <Step number="2" title="Personalize your feed" desc="Create folders and sort sources." />
//             <Step number="3" title="Read what you love" desc="Filter articles and enjoy your zone." />
//           </div>
//         </div>
//       </section>

//       {/* Auth Modal */}
//       {showAuthModal && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white p-8 rounded-xl shadow-xl w-[350px]">
//             <h2 className="text-2xl font-bold mb-4">{mode === "signup" ? "Create Account" : "Sign In"}</h2>

//             <input type="email" placeholder="Email" className="w-full p-2 border rounded mb-3" value={email} onChange={(e) => setEmail(e.target.value)} />
//             <input type="password" placeholder="Password" className="w-full p-2 border rounded mb-5" value={password} onChange={(e) => setPassword(e.target.value)} />

//             <Button className="w-full" onClick={handleAuth}>{mode === "signup" ? "Create Account" : "Sign In"}</Button>

//             <p className="text-sm text-center mt-3">
//               {mode === "signup" ? (
//                 <>Already have an account? <span className="text-primary underline cursor-pointer" onClick={() => setMode("login")}>Sign In</span></>
//               ) : (
//                 <>Don’t have an account? <span className="text-primary underline cursor-pointer" onClick={() => setMode("signup")}>Create Account</span></>
//               )}
//             </p>

//             <button className="mt-4 w-full text-gray-500 hover:text-black" onClick={() => setShowAuthModal(false)}>Cancel</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// /* FeatureCard Component */
// function FeatureCard({ title, desc, color, icon: Icon }: { title: string; desc: string; color: string; icon: React.ElementType }) {
//   return (
//     <motion.div className={`rounded-xl p-6 text-left shadow-sm mb-4 ${color}`}>
//       <div className="flex items-center gap-3 mb-3">
//         {Icon && <Icon className="w-6 h-6 text-[var(--navyblue)]" />}
//         <h4 className="text-2xl font-semibold text-[var(--navyblue)]">{title}</h4>
//       </div>
//       <p className="text-gray-700">{desc}</p>
//     </motion.div>
//   );
// }

// /* Step Component */
// function Step({ number, title, desc }: { number: string; title: string; desc: string }) {
//   return (
//     <div className="flex flex-col items-center text-inherit max-w-[190px] mx-auto">
//       <div className="w-20 h-20 rounded-full bg-[rgba(0,35,102,0.2)] flex items-center justify-center text-5xl font-bold text-[var(--beige)]">{number}</div>
//       <h5 className="mt-4 text-lg font-semibold whitespace-nowrap">{title}</h5>
//       <p className="mt-2 text-[var(--beige)] max-w-xs">{desc}</p>
//     </div>
//   );
// }




















// import { motion } from "framer-motion";
// import { SiteShowcase } from "./components/sites"
// // import { Benefits } from "./components/benefits"
// import { Button } from "./components/ui/button";
// import { Sparkles, FolderOpen, Crosshair } from "lucide-react";
// import { signUp, signIn, signOut } from "./auth"
// import { useState, useEffect } from "react";
// import { supabase } from "./lib/supabase";
// import { addUser } from "./services/api";


// const handleSignup = async () => {
//   const { error } = await signUp(email, password);
//   if (error) alert(error.message);
// };

// const handleLogin = async () => {
//   const { error } = await signIn(email, password);
//   if (error) alert(error.message);
// };

// useEffect(() => {
//   supabase.auth.onAuthStateChange((_event, session) => {
//     setUser(session?.user ?? null);
//   });
// }, []);




// export default function App() {
//   const [showAuthModal, setShowAuthModal] = useState(false);
//   const [mode, setMode] = useState<"login" | "signup">("signup");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [user, setUser] = useState<any>(null);

//   // Track login status
//   useEffect(() => {
//     const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
//       setUser(session?.user ?? null);
//     });

//     supabase.auth.getSession().then(({ data }) => {
//       setUser(data.session?.user ?? null);
//     });

//     return () => listener.subscription.unsubscribe();
//   }, []);




//   async function handleAuth() {
//   if (mode === "signup") {
//     const { data, error } = await signUp(email, password);

//     if (error) {
//       alert(error.message);
//       return;
//     }

//     // After sign up, Supabase returns user but requires email confirmation
//     if (data.user) {
//       await addUser(data.user.email!, data.user.id);   // Insert into DB
//     }

//     alert("Account created! Check your email for verification.");
//     setShowAuthModal(false);
//     return;
//   }
  
//   if (mode === "login") {
//     const { data, error } = await signIn(email, password);

//     if (error) {
//       alert(error.message);
//       return;
//     }

//     // At login, Supabase gives us user inside data.user
//     const supaUser = data.user;

//     if (!supaUser) {
//       alert("Login failed. No user found.");
//       return;
//     }

//     // After login → fetch DB user
//     const backendUser = await addUser(supaUser.email!, supaUser.id);

//     // store user info so sidebar, folders, etc work
//     localStorage.setItem("user_id", backendUser.user.user_id);

//     // close modal
//     setShowAuthModal(false);

//     // Navigate to homepage (or use React Router)
//     window.location.href = "/home";
//   }
// }


//  async function handleAuth() {
//   if (mode === "signup") {
//   const { data, error } = await signUp(email, password);

//   if (error) {
//     alert(error.message);
//     return;
//   }

//   if (data.user) {
//     await addUser(data.user.email!, data.user.id);   //THIS INSERTS INTO DB
//   }

//   alert("Account created! Check your email for verification.");
//   setShowAuthModal(false);
//   return;
// }


//   if (mode === "login") {
//     const { data: _data, error } = await signIn(email, password);

//     if (error) {
//       alert(error.message);
//       return;
//     }

//     setShowAuthModal(false);
//   }
// }


// async function handleLogout() {
//   const { error } = await signOut();

//   if (error) {
//     console.error("Logout error:", error);
//     alert("Failed to log out");
//     return;
//   }

//   localStorage.removeItem("user_id");
//   setUser(null);
//   window.location.href = "/";
// }


//   return (
//     <div className="bg-base mt-5 min-h-screen text-primary">
//       {/* Navbar */}
//       <header className="flex justify-between items-center px-8">
//         <h1 className="text-2xl font-bold">ReadArchive</h1>
//         <nav className="flex gap-6 items-center">
//           <a href="#features" className="hover:text-secondary transition">Features</a>
//           <a href="#contact" className="hover:text-secondary transition">Contact</a>
//           {!user ? (
//             <>
//               <button
//                 onClick={() => { setMode("signup"); setShowAuthModal(true); }}
//                 className="px-5 py-2 rounded-xl bg-primary text-base hover:bg-secondary transition"
//               >
//                 Create Account
//               </button>

//               <button
//                 onClick={() => { setMode("login"); setShowAuthModal(true); }}
//                 className="px-5 py-2 rounded-xl border border-primary rounded-xl hover:bg-primary transition"
//               >
//                 Sign In
//               </button>
//             </>
//           ) : (
//             <button
//               onClick={handleLogout}
//               className="px-5 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition"
//             >
//               Log Out
//             </button>
//           )}

//         </nav>
//       </header>

//       {/* Hero Section */}
//       <section className="text-center px-6 mt-16">
//         <motion.h2
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6 }}
//           className="text-5xl font-bold"
//         >
//           Build Your World of Ideas
//         </motion.h2>
//         <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto whitespace-nowrap">
//           ReadArchive brings the internet to you. Curate, filter, and organize content that matters <br />
//           Powered by personalization, Built for focus
//         </p>
//         <div className="mt-8 flex justify-center gap-4">
//           <Button onClick={() => { setMode("signup"); setShowAuthModal(true); }}>
//             Create Account
//           </Button>

//           <Button onClick={() => { setMode("login"); setShowAuthModal(true); }}>
//             Sign In
//           </Button>

//         </div>
//       </section>

//       <SiteShowcase />

//       {/* Features Preview */}
//       <div>
//         <p className="text-center font-bold text-3xl text-[var(--navyblue)]">Built for you to</p>
//       </div>
//       <div className="mt-10 max-w-6xl mx-auto">
//       <div className="flex flex-col md:flex-row gap-6">
//         <FeatureCard
//           title="Stay Focused"
//           desc="You decide what deserves your attention. Cut through the chaos of the internet and reveal only the content worth your attention. With intelligent filtering and a feed shaped entirely around your interests, ReadArchive transforms your reading into a focused, distraction-free space built specifically for you."
//           color="bg-[#F0F7FF]"
//           icon={Crosshair}
//         />
//         <FeatureCard
//           title="Organize Effortlessly"
//           desc="Take charge of your reading. Transform scattered content into a clear, organized system. With customizable folders, smart sorting, and effortless saving, ReadArchive helps you build the perfect structure for your ideas—everything in one place, exactly how you want it."
//           color="bg-[#F0F7FF]"
//           icon={FolderOpen}
//         />
//       </div>
//         <FeatureCard
//           title="Cut through the clutter"
//           desc="Categorized content at your fingertips, minus the distractions. Find what matters instantly. ReadArchive organizes your content into clean, intuitive categories, separating meaningful insights from the constant noise of the internet. With precise filters, distraction blocking, and smart prioritization, you can surface the articles and podcasts that align with your interests in seconds—no endless scrolling, no wasted time. Just a clear, focused reading experience shaped entirely around what you care about."
//           color="bg-[#F0F7FF]"
//           icon={Sparkles}
//         />
//       </div>

//       {/* How It Works */}
//       <section className="mt-10 rounded-lg text-center">
//         <div className="max-w-6xl mx-auto p-14 rounded-lg bg-[var(--navyblue)]">
//         <h3 className="text-3xl font-bold mb-10 text-[var(--beige)] ">How It Works</h3>
//         <div className="grid grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto text-[var(--beige)]">
//           <Step number="1" title="Bring your favourite content together" desc="Add your favourite news channels, articles, blogs, and podcasts."/>
//           <Step number="2" title="Personalize your feed" desc="Create folders, sort your sources by priority, and save your favourite articles" />
//           <Step number="3" title="Read what you love" desc="Filter articles by category and enjoy your personalised reading zone." />
//         </div>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="mt-15 py-8 text-center text-gray-500">
//         {/* © {new Date().getFullYear()} ReadArchive. All rights reserved. */}
//       </footer>

//       {showAuthModal && (
//   <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//     <div className="bg-white p-8 rounded-xl shadow-xl w-[350px]">
//       <h2 className="text-2xl font-bold mb-4">
//         {mode === "signup" ? "Create Account" : "Sign In"}
//       </h2>

//       <input
//         type="email"
//         placeholder="Email"
//         className="w-full p-2 border rounded mb-3"
//         value={email}
//         onChange={(e) => setEmail(e.target.value)}
//       />

//       <input
//         type="password"
//         placeholder="Password"
//         className="w-full p-2 border rounded mb-5"
//         value={password}
//         onChange={(e) => setPassword(e.target.value)}
//       />

//       <Button className="w-full" onClick={handleAuth}>
//         {mode === "signup" ? "Create Account" : "Sign In"}
//       </Button>

//       <p className="text-sm text-center mt-3">
//         {mode === "signup" ? (
//           <>
//             Already have an account?{" "}
//             <span
//               className="text-primary underline cursor-pointer"
//               onClick={() => setMode("login")}
//             >
//               Sign In
//             </span>
//           </>
//         ) : (
//           <>
//             Don’t have an account?{" "}
//             <span
//               className="text-primary underline cursor-pointer"
//               onClick={() => setMode("signup")}
//             >
//               Create Account
//             </span>
//           </>
//         )}
//       </p>

//       <button
//         className="mt-4 w-full text-gray-500 hover:text-black"
//         onClick={() => setShowAuthModal(false)}
//       >
//         Cancel
//       </button>
//     </div>
//   </div>
// )}

//     </div>


//   );
// }

// //Feature Card Component
// function FeatureCard({
//   title,
//   desc,
//   color,
//   icon: Icon
// }: {
//   title: string
//   desc: string
//   tag?: string
//   color: string
//   icon: React.ElementType 
// }) {
//   return (
//     <motion.div
//       className={`rounded-xl p-6 text-left shadow-sm mb-4 ${color}`}
//     >

//      {/* Icon + Title */}
//       <div className="flex items-center gap-3 mb-3">
//         {Icon && <Icon className="w-6 h-6 text-[var(--navyblue)]" />}  
//         <h4 className="text-2xl font-semibold text-[var(--navyblue)]">
//           {title}
//         </h4>
//       </div>

//       {/* Description */}
//       <p className="text-gray-700">{desc}</p>
//     </motion.div>
//   )
// }


// // Step Component
// function Step({ number, title, desc }: { number: string; title: string; desc: string }) {
//   return (
//     <div className="flex flex-col items-center text-inherit max-w-[190px] mx-auto">
//       <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-5xl font-bold">
//         {number}
//       </div>
//       <h5 className="mt-4 text-lg font-semibold whitespace-nowrap">{title}</h5>
//       <p className="text-[var(--beige)] mt-2 max-w-xs">{desc}</p>
//     </div>
//   );
// }

