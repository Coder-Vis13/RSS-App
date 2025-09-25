
import { useState } from "react"
import { X, Search } from "lucide-react"
import { Sites } from "../../components/web_sites" 
import { Button } from "../../components/ui/button"

export default function FeedPage() {
  const [showBanner, setShowBanner] = useState(true)

  return (
    <div className="p-8">
      {/*banner */}
      {showBanner && (
        <div className="relative w-full ml-0 bg-[var(--skyblue)] rounded-[var(--radius)] p-6 mb-8">
          <button
            onClick={() => setShowBanner(false)}
            className="absolute top-3 right-3 text-[var(--text)] hover:opacity-70"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold mb-2 text-[var(--text)]">
            Welcome to your Feed!
          </h2>
          <p className="text-[var(--text)]">
            You don’t have any sources yet. Add a new source to start building your personalized feed.
          </p>
        </div>
      )}
      <input
        type="search"
        placeholder="Paste url"
        className="rounded-l-full border border-secondary-border py-1 text-lg h-10 px-4 w-96 focus:border--grey outline-none"
      />
       <Button className="flex-shrink-0 h-10 py-2 px-4 rounded-r-full border-secondary-border border border-l-0">
            <Search />
        </Button>
        <Button className="ml-4">Add Feed</Button>

      {/* suggested sources -> clicking any of them should add that source to the feed*/}
      <section>
        <h3 className="mt-10 mb-0 text-lg font-bold text-[var(--text)]">
          Suggested Sources
        </h3>
      <section className="mt-0 flex overflow-y-auto">
        <Sites />
      </section>
      </section>
    </div>
  )
}



