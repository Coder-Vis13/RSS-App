
import { motion } from "framer-motion";
import { SiteShowcase } from "./components/sites";
// import { Benefits } from "./components/benefits"
import { Button } from "./components/ui/button";
import { Sparkles, FolderOpen, Crosshair, Clock, ArrowUp, Filter, Bookmark } from "lucide-react";
import { signUp, signIn, signOut } from "./auth";
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { addUser } from "./services/api";

export default function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Track login status
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleAuth() {
  if (mode === "signup") {
    const { data, error } = await signUp(email, password);
    if (error) return alert(error.message);

    if (data.user) {
      await addUser(data.user.email!, data.user.id); // Insert into DB
    }

    // Automatically redirect to home after signup
    window.location.href = "/home";
    return;
  }

  if (mode === "login") {
    const { data, error } = await signIn(email, password);
    if (error) return alert(error.message);

    if (!data.user) return alert("Login failed. No user found.");

    await addUser(data.user.email!, data.user.id); // Ensure user exists in your DB
    localStorage.setItem("user_id", data.user.id);

    // Redirect to home immediately
    window.location.href = "/home";
  }
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
    await signOut();
  }

  return (
    <div className="bg-base mt-5 min-h-screen text-primary">
      {/* Navbar */}
      <header className="flex justify-between items-center px-8 py-4 shadow-sm">
        <h1 className="text-2xl font-bold">ReadArchive</h1>
        <nav className="flex gap-6 items-center">
          <a href="#features" className="hover:text-secondary transition">
            Features
          </a>
          <a href="#contact" className="hover:text-secondary transition">
            Contact
          </a>

          {!user ? (
            <>
              <button
                onClick={() => {
                  setMode("signup");
                  setShowAuthModal(true);
                }}
                className="px-5 py-2 rounded-xl bg-primary text-base hover:bg-secondary transition"
              >
                Create Account
              </button>

              <button
                onClick={() => {
                  setMode("login");
                  setShowAuthModal(true);
                }}
                className="px-5 py-2 rounded-xl border border-primary hover:bg-primary transition"
              >
                Sign In
              </button>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="px-5 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition"
            >
              Log Out
            </button>
          )}
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
          ReadArchive brings the internet to you. Curate, filter, and organize content that matters
          <br />
          Powered by personalization, built for focus.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button
            onClick={() => {
              setMode("signup");
              setShowAuthModal(true);
            }}
          >
            Create Account
          </Button>
          <Button
            onClick={() => {
              setMode("login");
              setShowAuthModal(true);
            }}
          >
            Sign In
          </Button>
        </div>
      </section>

      {/* Site Showcase */}
      <SiteShowcase />

      {/* Features Preview */}
      <section className="mt-16 max-w-6xl mx-auto px-6">
        <p className="text-center font-bold text-3xl text-[var(--navyblue)]">
          Built for you to
        </p>
        <div className="mt-10 flex flex-col md:flex-row gap-6">
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
        <FeatureCard
          title="Cut through the clutter"
          desc="Categorized content at your fingertips, minus the distractions. Find what matters instantly. ReadArchive organizes your content into clean, intuitive categories, separating meaningful insights from the constant noise of the internet. With precise filters, distraction blocking, and smart prioritization, you can surface the articles and podcasts that align with your interests in seconds—no endless scrolling, no wasted time. Just a clear, focused reading experience shaped entirely around what you care about."
          color="bg-[#F0F7FF]"
          icon={Sparkles}
        />
      </section>

      {/* How It Works */}
      <section className="mt-16 text-center">
        <div className="max-w-6xl mx-auto p-14 rounded-lg bg-[var(--navyblue)]">
          <h3 className="text-3xl font-bold mb-10 text-[var(--beige)]">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-[var(--beige)]">
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
<section className="mt-20 max-w-6xl mx-auto px-6 py-16 bg-[#F0F7FF] rounded-3xl">
  <h3 className="text-3xl font-bold text-center text-[var(--navyblue)] mb-12">
    How Your Feed Is Generated
  </h3>

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">    
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-3">
        <FolderOpen className="w-6 h-6 text-[var(--navyblue)]" />
        <h4 className="text-xl font-semibold text-[var(--navyblue)]">Adding Your Sources</h4>
      </div>
      <p className="text-gray-700">
        Add any website or blog using its link. The app
        fetches the articles/blogs/podcasts published in the past 2 days so that you can stay connected to your favourite content.
      </p>
    </div>

    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-3">
        <Clock className="w-6 h-6 text-[var(--navyblue)]" />
        <h4 className="text-xl font-semibold text-[var(--navyblue)]">Automatic Refresh</h4>
      </div>
      <p className="text-gray-700">
        Every 2 hours,the app checks all your sources and pulls
        newly published articles/podcasts.
      </p>
    </div>

    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
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

<div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl">      <div className="flex items-center gap-3 mb-3">
        <Filter className="w-6 h-6 text-[var(--navyblue)]" />
        <h4 className="text-xl font-semibold text-[var(--navyblue)]">Categories & Filters</h4>
      </div>
      <p className="text-gray-700">
        Articles are automatically categorized. Filter
        your feed by topics like tech, business, news, or lifestyle to find what you love.
      </p>
    </div>

<div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl">      
  <div className="flex items-center gap-3 mb-3">
        <Bookmark className="w-6 h-6 text-[var(--navyblue)]" />
        <h4 className="text-xl font-semibold text-[var(--navyblue)]">Saved Articles</h4>
      </div>
      <p className="text-gray-700">
        Organize your content into custom folders and save anything you love. Saved items never disappear.
      </p>
    </div>

  </div>
</section>

      {/* Footer */}
      <footer className="mt-16 py-8 text-center text-gray-500">
        {/* © {new Date().getFullYear()} ReadArchive. All rights reserved. */}
      </footer>

      {/* Authentication Modal */}
{/* Authentication Modal */}
{showAuthModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white p-8 rounded-2xl shadow-2xl w-[400px]">
      <h2 className="text-2xl font-bold mb-2 text-center">
        {mode === "signup" ? "Create Account" : "Sign In"}
      </h2>

      <p className="text-gray-600 text-center mb-6">
        {mode === "signup"
          ? "Start your journey with ReadArchive. Sign up to organize, filter, and access content that matters to you."
          : "Welcome back! Access your personalized feed and continue where you left off."}
      </p>

      {/* Modern Input Fields */}
<div className="flex flex-col gap-5">
  {/* Email Field */}
  <div className="flex flex-col">
    <label className="mb-2 text-gray-500 font-medium">
      Enter your email address
    </label>
    <input
      type="email"
      className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      required
      autoComplete="new-email"  // Prevent autofill
    />
  </div>

  {/* Password Field */}
  <div className="flex flex-col">
    <label className="mb-2 text-gray-500 font-medium">
      {mode === "signup" ? "Create a secure password" : "Enter your password"}
    </label>
    <input
      type="password"
      className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      required
      autoComplete="new-password"  // Prevent autofill
    />
  </div>
</div>





      <Button className="w-full mt-6" onClick={handleAuth}>
        {mode === "signup" ? "Create Account" : "Sign In"}
      </Button>

      {/* {mode === "login" && (
        <p className="text-sm text-gray-500 text-center mt-2">
          Forgot your password? You can reset it anytime.
        </p>
      )} */}

      <p className="text-sm text-center mt-4">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <span
              className="text-primary underline cursor-pointer"
              onClick={() => setMode("login")}
            >
              Sign In
            </span>
          </>
        ) : (
          <>
            Don’t have an account?{" "}
            <span
              className="text-primary underline cursor-pointer"
              onClick={() => setMode("signup")}
            >
              Create Account
            </span>
          </>
        )}
      </p>

      <button
        className="mt-4 w-full text-gray-500 hover:text-black"
        onClick={() => setShowAuthModal(false)}
      >
        Cancel
      </button>
    </div>
  </div>
)}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-[400px] max-w-[90%] text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome to ReadArchive!</h2>
            <p className="text-gray-600 mb-6">
              Let’s personalize your experience. Please tell us your name.
            </p>
            <input
              type="text"
              placeholder="Your name"
              className="w-full p-3 border rounded-lg mb-6 text-center"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button className="w-full mb-3" onClick={handleFinishOnboarding}>
              Continue
            </Button>
            <button
              className="w-full text-gray-500 hover:text-black"
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
    <motion.div className={`rounded-xl p-6 text-left shadow-sm mb-4 ${color}`}>
      <div className="flex items-center gap-3 mb-3">
        {Icon && <Icon className="w-6 h-6 text-[var(--navyblue)]" />}
        <h4 className="text-2xl font-semibold text-[var(--navyblue)]">{title}</h4>
      </div>
      <p className="text-gray-700">{desc}</p>
    </motion.div>
  );
}

// Step Component
function Step({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center text-inherit max-w-[190px] mx-auto">
      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-5xl font-bold">
        {number}
      </div>
      <h5 className="mt-4 text-lg font-semibold whitespace-nowrap">{title}</h5>
      <p className="text-[var(--beige)] mt-2 max-w-xs">{desc}</p>
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

