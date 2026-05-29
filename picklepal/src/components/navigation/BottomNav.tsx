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

export function BottomNav({ groupSlug }: { readonly groupSlug: string }) {
  const pathname = usePathname();
  const navItems = getNavItems(groupSlug);

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-sm md:hidden"
    >
      <ul className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors duration-200 ${
                  active
                    ? "text-court-green"
                    : "text-text-muted hover:text-text-secondary"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {item.icon}
                <span className="text-[10px] font-medium leading-tight">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
