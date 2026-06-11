"use client";

import { MotionConfig } from "motion/react";
import { SessionProvider } from "next-auth/react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // reducedMotion="user" makes every motion/react animation respect the OS
  // "reduce motion" setting (CSS already covers plain CSS transitions).
  return (
    <SessionProvider>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </SessionProvider>
  );
}
