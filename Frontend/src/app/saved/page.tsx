
import { useState } from "react"
import { X } from "lucide-react"


export default function SavedPage() {
  const [showBanner, setShowBanner] = useState(true)

     return (
    <div className="p-8 w-full">
      {/* Welcome Banner */}
      {showBanner && (
        <div className="relative w-full ml-0 bg-[var(--skyblue)] rounded-[var(--radius)] p-6 mb-8">
          <button
            onClick={() => setShowBanner(false)}
            className="absolute top-3 right-3 text-[var(--text)] hover:opacity-70"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold mb-2 text-[var(--text)]">
            Saved
          </h2>
          <p className="text-[var(--text)]">
            Found something worth keeping? Save it to build your personal library right here
          </p>
        </div>
      )}
    </div>
) }

