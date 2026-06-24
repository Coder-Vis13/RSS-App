import { motion } from "framer-motion";
import { SiteShowcase } from "./components/sites";
import { Button } from "./components/ui/button";
import { useEffect, useState } from "react";
import { signIn, signUp, signOut, getAuthUserId } from "./auth";
import { Github, Linkedin, ArrowRight } from "lucide-react";

export default function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<any>(null);
  // const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");

  async function handleAuth() {
    try {
      if (mode === "signup") {
        await signUp(name, email, password);
      } else {
        await signIn(email, password);
      }

      setUser({ email });
      setShowAuthModal(false);
      window.location.href = "/feed";
    } catch {
      alert("Authentication failed. Please check credentials and try again.");
    }
  }

  async function handleLogout() {
    await signOut();
    setUser(null);
    window.location.href = "/landing";
  }

  useEffect(() => {
    if (getAuthUserId()) setUser({ email: "authenticated" });
  }, []);

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
              href="#workflow"
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
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <div className="flex flex-col items-center text-center">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="max-w-4xl mx-auto text-3xl sm:text-5xl lg:text-6xl whitespace-nowrap font-semibold tracking-tight text-[var(--navyblue)]"
            >
              Follow the internet without the noise
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
              className="mx-auto mt-5 max-w-2xl text-[15px] sm:text-base leading-relaxed text-gray-600 whitespace-nowrap"
            >
              Follow any website, blog, podcast, or YouTube channel—all in one
              personalized, AI-powered feed.
              <span className="hidden sm:inline"> </span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
              className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4"
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
        </div>
      </section>

      {/* Site Showcase */}
      <section className="mx-auto px-6">
        <div className="relative py-3">
          <SiteShowcase />
        </div>
      </section>

      {/* App Preview */}
      <section className="mx-auto mt-16 max-w-8xl px-6">
        <img
          src="/app_img.png"
          alt="ReadArchive interface"
          className="w-full rounded-2xl"
        />
      </section>

      {/* How It Works */}
      <section id="workflow" className="mx-auto mt-24 max-w-6xl px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
            HOW IT WORKS
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--navyblue)]">
            Build your perfect feed
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-gray-600">
            Add your favourite sources once. <br /> ReadArchive keeps everything
            updated, organised and easy to browse.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3 ">
          <Step
            number="01"
            title="Add your favourite sources"
            desc="Import RSS feeds, blogs, podcasts and YouTube channels into one place."
          />

          <Step
            number="02"
            title="Stay organised"
            desc="Group sources into folders, filter by category and save articles for later."
          />

          <Step
            number="03"
            title="Never miss an update"
            desc="New content is fetched automatically so your feed is always up to date."
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto mt-28 max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-[40px] bg-[var(--navyblue)] px-8 py-20 text-center shadow-2xl">
          <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <h2 className="text-4xl font-semibold tracking-tight text-white">
              Ready to build your own feed?
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/75">
              Organize everything you read in one place with AI-powered
              categories, folders, saved articles and automatic updates.
            </p>

            <Button
              onClick={() => {
                setMode("signup");
                setShowAuthModal(true);
              }}
              className="mt-10 h-12 rounded-2xl bg-white px-7 text-[var(--navyblue)] hover:bg-white/90"
            >
              Create Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-24 border-t border-black/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-6 py-12">
          <h3 className="text-lg font-semibold text-[var(--navyblue)]">
            Designed & developed by Vismaya Gowda
          </h3>

          <div className="flex items-center gap-8">
            <a
              href="https://github.com/Coder-Vis13"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 transition hover:text-[var(--navyblue)]"
            >
              <Github size={22} />
              <span>GitHub</span>
            </a>

            <a
              href="https://www.linkedin.com/in/vismaya-gowda-8450612bb"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 transition hover:text-[#0A66C2]"
            >
              <Linkedin size={22} />
              <span>LinkedIn</span>
            </a>
          </div>

          <p className="text-sm text-gray-400">
            ReadArchive • Full-stack portfolio project
          </p>
        </div>
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
              {/* Name Field */}

              {mode === "signup" && (
                <div className="flex flex-col">
                  <label className="mb-2 text-sm text-gray-500 font-medium">
                    Your name
                  </label>
                  <input
                    type="text"
                    className="w-full p-4 border border-black/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--navyblue)]/30"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}
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
                  autoComplete="new-email"
                />
              </div>

              {/* Password Field */}
              <div className="flex flex-col">
                <label className="mb-2 text-sm text-gray-500 font-medium">
                  {mode === "signup"
                    ? "Create a secure password"
                    : "Enter your password"}
                </label>
                <input
                  type="password"
                  className="w-full p-4 border border-black/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--navyblue)]/30 focus:border-[var(--navyblue)]/30"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <Button
              className="w-full mt-6 h-11 rounded-2xl"
              onClick={handleAuth}
            >
              {mode === "signup" ? "Create Account" : "Sign In"}
            </Button>

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
    </div>
  );
}

function Step({
  number,
  title,
  desc,
}: {
  number: string;
  title: string;
  desc: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm"
    >
      <p className="text-5xl font-semibold tracking-tight text-gray-400">
        {number}
      </p>

      <h3 className="mt-6 text-xl font-semibold text-[var(--navyblue)]">
        {title}
      </h3>

      <p className="mt-3 leading-7 text-gray-600">{desc}</p>
    </motion.div>
  );
}
