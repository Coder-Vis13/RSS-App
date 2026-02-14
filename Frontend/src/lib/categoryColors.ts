export type CategoryColorEntry = {
  classes?: string;
  bg?: string;
  text?: string;
};

export const CATEGORY_COLOR_MAP: Record<string, CategoryColorEntry> = {
  // Uncategorized (no color in DB)
  uncategorized: {
    classes: "bg-gray-100 text-gray-700",
    bg: "#F3F4F6",
    text: "#374151",
  },

  news: {
    classes: "bg-blue-100 text-blue-700",
    bg: "#DBEAFE",
    text: "#1D4ED8",
  },

  health: {
    classes: "bg-emerald-100 text-emerald-700",
    bg: "#D1FAE5",
    text: "#047857",
  },

  finance: {
    classes: "bg-stone-100 text-stone-700",
    bg: "#e3e3e1ff",
    text: "#44403C",
  },

  politics: {
    classes: "bg-red-100 text-red-700",
    bg: "#FEE2E2",
    text: "#B91C1C",
  },

  photography: {
    classes: "bg-lime-100 text-lime-700",
    bg: "#ECFCCB",
    text: "#4D7C0F",
  },

  culture: {
    classes: "bg-indigo-100 text-indigo-700",
    bg: "#E0E7FF",
    text: "#3730A3",
  },

  tech: {
    classes: "bg-sky-100 text-sky-700",
    bg: "#E0F2FE",
    text: "#0369A1",
  },

  productivity: {
    classes: "bg-teal-100 text-teal-700",
    bg: "#CCFBF1",
    text: "#0F766E",
  },

  career: {
    classes: "bg-amber-100 text-amber-700",
    bg: "#FEF3C7",
    text: "#B45309",
  },

  spirituality: {
    classes: "bg-yellow-100 text-yellow-700",
    bg: "#FEF9C3",
    text: "#A16207",
  },

  lifestyle: {
    classes: "bg-purple-100 text-purple-700",
    bg: "#F3E8FF",
    text: "#6B21A8",
  },

  fashion: {
    classes: "bg-pink-100 text-pink-700",
    bg: "#FCE7F3",
    text: "#BE185D",
  },

  science: {
    classes: "bg-violet-100 text-violet-700",
    bg: "#EDE9FE",
    text: "#5B21B6",
  },

  realestate: {
    classes: "bg-rose-200 text-rose-800",
    bg: "#FECACA",
    text: "#9F1239",
  },

  food: {
    classes: "bg-orange-100 text-orange-700",
    bg: "#FFEDD5",
    text: "#C2410C",
  },

  technology: {
    classes: "bg-sky-100 text-sky-700",
    bg: "#E0F2FE",
    text: "#0369A1",
  },

  history: {
    classes: "bg-gray-100 text-gray-700", // assigned neutral (missing in DB)
    bg: "#F3F4F6",
    text: "#374151",
  },

  business: {
    classes: "bg-teal-200 text-teal-800",
    bg: "#99F6E4",
    text: "#115E59",
  },

  sports: {
    classes: "bg-lime-200 text-lime-800",
    bg: "#D9F99D",
    text: "#365314",
  },

  entertainment: {
    classes: "bg-rose-100 text-rose-700",
    bg: "#FFE4E6",
    text: "#BE123C",
  },

  education: {
    classes: "bg-fuchsia-100 text-fuchsia-700",
    bg: "#FCE7F3",
    text: "#A21CAF",
  },

  environment: {
    classes: "bg-cyan-200 text-cyan-800",
    bg: "#A5F3FC",
    text: "#155E75",
  },
};

const normalizeKey = (name: string | undefined) =>
  (name || "").toString().trim().toLowerCase().replace(/\s+/g, "");

/**
 * Given a backend-provided category object or a simple name,
 * return an object with:
 *  - className: string of tailwind classes to put on className (may be empty)
 *  - style: inline style fallback (bgColor/textColor) — React.CSSProperties
 *
 * Priority:
 * 1. If backendClasses is provided (from backend), use it in className and also
 *    try to derive inline hex using our map (if possible).
 * 2. Else use map entry for category name.
 * 3. Else use default fallback.
 */
export const getCategoryPresentation = (
  backendColorStr: string | null | undefined,
  categoryName: string | null | undefined,
): { className: string; style: React.CSSProperties } => {
  const defaultCls = "bg-gray-200 text-gray-700";
  const defaultStyle: React.CSSProperties = {
    backgroundColor: "#E5E7EB",
    color: "#374151",
  };

  // parse backend classes (e.g. "bg-blue-100 text-blue-700")
  let backendClasses = "";
  let inlineStyle: React.CSSProperties = {};

  if (
    backendColorStr &&
    typeof backendColorStr === "string" &&
    backendColorStr.trim()
  ) {
    backendClasses = backendColorStr.trim();
    // try to find matching hexs from our map using tokens (bg-... / text-...)
    const tokens = backendClasses.split(/\s+/);
    const bgToken = tokens.find((t) => t.startsWith("bg-"));
    const textToken = tokens.find((t) => t.startsWith("text-"));

    if (bgToken) {
      // find map entry that contains this bgToken in classes (fast heuristic)
      const found = Object.values(CATEGORY_COLOR_MAP).find(
        (e) => e.classes && e.classes.includes(bgToken),
      );
      if (found?.bg) inlineStyle.backgroundColor = found.bg;
    }
    if (textToken) {
      const foundText = Object.values(CATEGORY_COLOR_MAP).find(
        (e) => e.classes && e.classes.includes(textToken),
      );
      if (foundText?.text) inlineStyle.color = foundText.text;
    }
  }

  // if we didn't get inline style from backend classes, try map lookup by name
  if ((!inlineStyle.backgroundColor || !inlineStyle.color) && categoryName) {
    const key = normalizeKey(categoryName);
    const mapEntry = CATEGORY_COLOR_MAP[key];
    if (mapEntry) {
      if (!inlineStyle.backgroundColor && mapEntry.bg)
        inlineStyle.backgroundColor = mapEntry.bg;
      if (!inlineStyle.color && mapEntry.text)
        inlineStyle.color = mapEntry.text;
      // if backend didn't provide classes, use map classes
      if (!backendClasses && mapEntry.classes)
        backendClasses = mapEntry.classes;
    }
  }

  // final fallbacks
  const className = backendClasses || defaultCls;
  const style = Object.keys(inlineStyle).length ? inlineStyle : defaultStyle;

  return { className, style };
};
