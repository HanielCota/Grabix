"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { UpgradeDialog } from "./upgrade-dialog";

const UpgradeContext = createContext<{ open: () => void }>({ open: () => {} });

export function useUpgrade() {
  return useContext(UpgradeContext);
}

export function UpgradeProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <UpgradeContext.Provider value={{ open }}>
      {children}
      <UpgradeDialog open={isOpen} onClose={close} />
    </UpgradeContext.Provider>
  );
}
