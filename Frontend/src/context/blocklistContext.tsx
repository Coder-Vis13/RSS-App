import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface BlocklistContextType {
  blocklist: string[];
  addWord: (word: string) => void;
  removeWord: (word: string) => void;
}

const BlocklistContext = createContext<BlocklistContextType | undefined>(undefined);

export const useBlocklist = () => {
  const context = useContext(BlocklistContext);
  if (!context) throw new Error("useBlocklist must be used within a BlocklistProvider");
  return context;
};

export const BlocklistProvider = ({ children }: { children: ReactNode }) => {
  const [blocklist, setBlocklist] = useState<string[]>([]);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("blocklist");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setBlocklist(parsed);
      } catch {
        setBlocklist([]);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("blocklist", JSON.stringify(blocklist));
  }, [blocklist]);

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
