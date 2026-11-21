import { PageTransition } from "@/components/motion";

// A template remounts on every change of page, so each page animates in (D7).
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
