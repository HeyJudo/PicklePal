"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  LiveIcon,
  BoardIcon,
  HistoryIcon,
  PlayersIcon,
} from "@/components/icons";

interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: React.ReactNode;
}

function getNavItems(groupSlug: string): readonly NavItem[] {
  const base = `/g/${groupSlug}`;
  return [
    { label: "Home", href: base, icon: <HomeIcon className="w-5 h-5" /> },
    { label: "Live", href: `${base}/live`, icon: <LiveIcon className="w-5 h-5" /> },
    { label: "Board", href: `${base}/board`, icon: <BoardIcon className="w-5 h-5" /> },
    { label: "History", href: `${base}/history`, icon: <HistoryIcon className="w-5 h-5" /> },
    { label: "Players", href: `${base}/players`, icon: <PlayersIcon className="w-5 h-5" /> },
  ] as const;
}

function isActive(pathname: string, href: string): boolean {
  if (href.match(/\/g\/[^/]+$/)) return pathname === href;
  return pathname.startsWith(href);
}

export function DesktopNav({ groupSlug }: { readonly groupSlug: string }) {
  const pathname = usePathname();
  const navItems = getNavItems(groupSlug);
  const isLivePage = pathname.startsWith(`/g/${groupSlug}/live`);

  return (
    <aside
      aria-label="Main navigation"
      className="hidden md:flex md:flex-col md:w-56 lg:w-64 border-r border-border bg-surface h-full fixed left-0 top-0 z-30"
    >
      {/* Brand header */}
      <div className="px-5 py-5 border-b border-border">
        <Link
          href="/app"
          className="flex items-center gap-2.5 group"
          title="My Groups"
        >
          <div className="w-8 h-8 rounded-lg bg-court-green flex items-center justify-center shrink-0 shadow-sm group-hover:bg-court-green-light transition-colors">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="10" r="7" />
              <rect x="10.5" y="16" width="3" height="6" rx="1.5" />
              <line x1="8.5" y1="7" x2="15.5" y2="13" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
              <line x1="8.5" y1="10" x2="15.5" y2="10" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
              <line x1="8.5" y1="13" x2="15.5" y2="7" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            </svg>
          </div>
          <div>
            <span className="text-base font-extrabold text-text-primary tracking-tight leading-none">
              DinkDay
            </span>
            <p className="text-[10px] text-text-muted font-medium leading-tight mt-0.5">
              My Groups
            </p>
          </div>
        </Link>
      </div>

      {/* Live session pill — shown when on live page */}
      {isLivePage && (
        <div className="mx-3 mt-3 rounded-xl bg-court-green/8 border border-court-green/20 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-court-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-court-green" />
            </span>
            <span className="text-xs font-semibold text-court-green">Game Day Active</span>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    active
                      ? "bg-court-green text-white shadow-sm"
                      : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <span className={active ? "text-white" : "text-text-muted"}>
                    {item.icon}
                  </span>
                  {item.label}
                  {item.label === "Live" && !active && (
                    <span
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-court-green"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <p className="text-[10px] text-text-muted">picklepal.app</p>
      </div>
    </aside>
  );
}
