
import { useState } from "react"
import { X } from "lucide-react"


export default function RulesPage() {
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
            Rules let you fine-tune your feed so it shows you only what matters most
          </h2>
          <p className="text-[var(--text)]">
            <b>Priority</b> → Rank sources higher or lower. Priority items will surface at the top of your feed so you never miss them <br />
            <b>Snooze</b> Snooze → Take a break from a source without removing it. Snoozed sources disappear for a while and come back automatically later
          </p>
        </div>
      )}
    </div>
) }


