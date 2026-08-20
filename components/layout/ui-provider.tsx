"use client";

import React from "react";
import type { Trade } from "@/lib/types";

interface UIState {
  addOpen: boolean;
  editing: Trade | null;
  commandOpen: boolean;
  openAdd: (trade?: Trade | null) => void;
  closeAdd: () => void;
  openCommand: () => void;
  closeCommand: () => void;
}

const UIContext = React.createContext<UIState | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [addOpen, setAddOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Trade | null>(null);
  const [commandOpen, setCommandOpen] = React.useState(false);

  const openAdd = React.useCallback((trade?: Trade | null) => {
    setEditing(trade ?? null);
    setAddOpen(true);
  }, []);

  const value = React.useMemo<UIState>(
    () => ({
      addOpen,
      editing,
      commandOpen,
      openAdd,
      closeAdd: () => setAddOpen(false),
      openCommand: () => setCommandOpen(true),
      closeCommand: () => setCommandOpen(false),
    }),
    [addOpen, editing, commandOpen, openAdd]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIState {
  const ctx = React.useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
}
