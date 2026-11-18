import { createContext, useContext, type Dispatch, type SetStateAction } from "react";

interface SidebarContextValue {
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
}

const SidebarContext = createContext<SidebarContextValue>({
  sidebarOpen: false,
  setSidebarOpen: () => {},
});

export function useSidebar(): SidebarContextValue {
  return useContext(SidebarContext);
}

export default SidebarContext;
