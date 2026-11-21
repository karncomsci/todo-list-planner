import { AppShell } from "@/components/app-shell";
import { MotionProvider } from "@/components/motion";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <AppShell>{children}</AppShell>
    </MotionProvider>
  );
}
