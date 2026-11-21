import { Ellipsis } from "lucide-react";
import { OwnerEmail, SignOutButton } from "./account";
import { Brand } from "./brand";
import { NavLink } from "./nav-link";
import { bottomNav, moreNav, type NavItem, sideNav } from "./navigation";
import { ThemeToggle } from "./theme-toggle";

function Entry({ item, layout }: { item: NavItem; layout: "row" | "stack" }) {
  const Icon = item.icon;
  return (
    <NavLink href={item.href} label={item.label} ready={item.ready} layout={layout}>
      <Icon aria-hidden />
    </NavLink>
  );
}

/** The frame around every signed-in page: left menu on computers, bottom menu on phones (D10). */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh md:pl-64">
      {/* Computer: left menu */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-surface p-4 md:flex">
        <div className="px-2 py-2">
          <Brand />
        </div>
        <nav aria-label="เมนูหลัก" className="mt-6 flex flex-1 flex-col gap-1">
          {sideNav.map((item) => (
            <Entry key={item.href} item={item} layout="row" />
          ))}
        </nav>
        <div className="flex items-center gap-1 border-t border-border pt-3 pl-2">
          <div className="min-w-0 flex-1">
            <OwnerEmail />
          </div>
          <ThemeToggle />
          <SignOutButton />
        </div>
      </aside>

      {/* Phone: top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-4 py-2 md:hidden">
        <Brand />
        <div className="flex items-center">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl p-4 pb-24 md:p-8">{children}</main>

      {/* Phone: bottom menu with five buttons */}
      <nav
        aria-label="เมนูหลัก"
        className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {bottomNav.map((item) => (
          <Entry key={item.href} item={item} layout="stack" />
        ))}
        <button
          type="button"
          popoverTarget="more-menu"
          className="flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-[11px] text-muted"
        >
          <Ellipsis className="size-6" aria-hidden />
          <span>เพิ่มเติม</span>
        </button>
      </nav>

      <div
        id="more-menu"
        popover="auto"
        className="inset-x-3 top-auto bottom-20 m-0 w-auto rounded-2xl border border-border bg-surface p-2 text-text shadow-xl backdrop:bg-black/30 md:hidden"
      >
        <nav aria-label="เมนูเพิ่มเติม" className="flex flex-col gap-1">
          {moreNav.map((item) => (
            <Entry key={item.href} item={item} layout="row" />
          ))}
        </nav>
      </div>
    </div>
  );
}
