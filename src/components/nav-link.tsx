"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  label: string;
  /** False until the stage that builds the page: the entry shows as disabled. */
  ready: boolean;
  /** "row" for the left menu and the More menu, "stack" for the phone's bottom menu. */
  layout: "row" | "stack";
  /** The rendered icon. */
  children: React.ReactNode;
};

/** One menu entry, highlighted when its page is open. */
export function NavLink({ href, label, ready, layout, children }: Props) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  const shape =
    layout === "row"
      ? "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] [&_svg]:size-5 [&_svg]:shrink-0"
      : "flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-[11px] [&_svg]:size-6";
  const content = (
    <>
      {children}
      <span className="truncate">{label}</span>
    </>
  );

  if (!ready) {
    return (
      <span
        aria-disabled="true"
        title="ยังไม่เปิดใช้งาน"
        className={`${shape} cursor-not-allowed text-muted opacity-45`}
      >
        {content}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`${shape} ${active ? "bg-primary-soft font-medium text-primary" : "text-muted hover:text-text"}`}
    >
      {content}
    </Link>
  );
}
