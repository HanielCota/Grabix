"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { UpgradeDialog } from "./upgrade-dialog";

const UpgradeContext = createContext<{ open: (reason?: string) => void }>({ open: () => {} });

export function useUpgrade() {
  return useContext(UpgradeContext);
}

export function UpgradeProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const open = useCallback((reason?: string) => {
    // Some callers wire this straight to onClick, which would pass a MouseEvent —
    // only treat an explicit string as a contextual reason.
    setReason(typeof reason === "string" ? reason : null);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <UpgradeContext.Provider value={{ open }}>
      {children}
      <UpgradeDialog open={isOpen} onClose={close} reason={reason} />
    </UpgradeContext.Provider>
  );
}
