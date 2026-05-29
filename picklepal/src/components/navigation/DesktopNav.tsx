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
    {
      label: "Live",
      href: `${base}/live`,
      icon: <LiveIcon className="w-5 h-5" />,
    },
    {
      label: "Board",
      href: `${base}/board`,
      icon: <BoardIcon className="w-5 h-5" />,
    },
    {
      label: "History",
      href: `${base}/history`,
      icon: <HistoryIcon className="w-5 h-5" />,
    },
    {
      label: "Players",
      href: `${base}/players`,
      icon: <PlayersIcon className="w-5 h-5" />,
    },
  ] as const;
}

function isActive(pathname: string, href: string): boolean {
  if (href.match(/\/g\/[^/]+$/)) {
    return pathname === href;
  }
  return pathname.startsWith(href);
}

export function DesktopNav({ groupSlug }: { readonly groupSlug: string }) {
  const pathname = usePathname();
  const navItems = getNavItems(groupSlug);

  return (
    <aside
      aria-label="Main navigation"
      className="hidden md:flex md:flex-col md:w-56 lg:w-64 border-r border-border bg-surface-muted h-full fixed left-0 top-0"
    >
      <div className="p-4 border-b border-border">
        <Link href={`/g/${groupSlug}`} className="flex items-center gap-2">
          <span className="text-xl font-bold text-court-green">PicklePal</span>
        </Link>
      </div>

      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    active
                      ? "bg-court-green/10 text-court-green"
                      : "text-text-secondary hover:bg-surface hover:text-text-primary"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
