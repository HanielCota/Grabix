import { auth } from "@/auth";
import { CustomerShell } from "@/components/workspace/customer-shell";

export default async function AnalysesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return session?.user ? <CustomerShell>{children}</CustomerShell> : children;
}
