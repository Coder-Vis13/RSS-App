import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { DEMO_BLOCKLIST_STORAGE_KEY, isDemoMode } from "@/auth";

interface BlocklistContextType {
  blocklist: string[];
  addWord: (word: string) => void;
  removeWord: (word: string) => void;
}

const BlocklistContext = createContext<BlocklistContextType | undefined>(
  undefined,
);

const USER_BLOCKLIST_STORAGE_KEY = "blocklist";

function readBlocklist(storageKey: string): string[] {
  const stored = localStorage.getItem(storageKey);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const useBlocklist = () => {
  const context = useContext(BlocklistContext);
  if (!context)
    throw new Error("useBlocklist must be used within a BlocklistProvider");
  return context;
};

export const BlocklistProvider = ({ children }: { children: ReactNode }) => {
  const [storageKey] = useState(
    () =>
      isDemoMode()
        ? DEMO_BLOCKLIST_STORAGE_KEY
        : USER_BLOCKLIST_STORAGE_KEY,
  );

  const [blocklist, setBlocklist] = useState<string[]>(() => {
    return readBlocklist(storageKey);
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(blocklist));
  }, [storageKey, blocklist]);

  const addWord = (word: string) => {
    const trimmed = word.trim().toLowerCase();
    if (!trimmed || blocklist.includes(trimmed)) return;
    setBlocklist((prev) => [...prev, trimmed]);
  };

  const removeWord = (word: string) => {
    setBlocklist((prev) => prev.filter((w) => w !== word));
  };

  return (
    <BlocklistContext.Provider value={{ blocklist, addWord, removeWord }}>
      {children}
    </BlocklistContext.Provider>
  );
};
