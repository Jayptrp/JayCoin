import { createContext, useContext, useMemo, type ReactNode } from "react";
import { type Container, createContainer } from "./di";

const AppContext = createContext<Container | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const container = useMemo(() => createContainer(), []);
  return (
    <AppContext.Provider value={container}>{children}</AppContext.Provider>
  );
}

export function useContainer(): Container {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useContainer must be used inside <AppProvider>");
  return ctx;
}
