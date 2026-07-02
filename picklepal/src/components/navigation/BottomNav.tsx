"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  HomeIcon,
  LiveIcon,
  BoardIcon,
  HistoryIcon,
  PlayersIcon,
} from "@/components/icons";
import { Crown } from "lucide-react";

interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: React.ReactNode;
}

function getNavItems(groupSlug: string): readonly NavItem[] {
  const base = `/g/${groupSlug}`;
  return [
    { label: "Home", href: base, icon: <HomeIcon className="w-[22px] h-[22px]" /> },
    { label: "Live", href: `${base}/live`, icon: <LiveIcon className="w-[22px] h-[22px]" /> },
    { label: "Board", href: `${base}/board`, icon: <BoardIcon className="w-[22px] h-[22px]" /> },
    { label: "History", href: `${base}/history`, icon: <HistoryIcon className="w-[22px] h-[22px]" /> },
    { label: "Players", href: `${base}/players`, icon: <PlayersIcon className="w-[22px] h-[22px]" /> },
    { label: "Titles", href: `${base}/belts`, icon: <Crown className="w-[22px] h-[22px]" /> },
  ] as const;
}

function isActive(pathname: string, href: string): boolean {
  if (href.match(/\/g\/[^/]+$/)) return pathname === href;
  return pathname.startsWith(href);
}

export function BottomNav({ groupSlug }: { readonly groupSlug: string }) {
  const pathname = usePathname();
  const navItems = getNavItems(groupSlug);
  const isLivePage = pathname.startsWith(`/g/${groupSlug}/live`);

  return (
    <nav
      aria-label="Main navigation"
      className={[
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "border-t bg-surface/97 backdrop-blur-md",
        /* On live page, subtly tint the bar to signal active game */
        isLivePage ? "border-court-green/30" : "border-border",
      ].join(" ")}
    >
      <ul className="flex items-stretch justify-around h-16 px-1">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          const isLiveItem = item.label === "Live";

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-col items-center justify-center h-full pt-1 gap-0.5 min-w-[44px]"
              >
                {/* Animated top-bar indicator — slides between active tabs */}
                {active && (
                  <motion.span
                    layoutId="bottom-nav-indicator"
                    className="absolute top-0 left-[20%] right-[20%] h-[3px] rounded-b-full bg-court-green"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}

                {/* Icon — scales up when active */}
                <motion.span
                  animate={{ scale: active ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={[
                    "transition-colors duration-150 relative",
                    active ? "text-court-green" : "text-text-muted",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {item.icon}

                  {/* Live pulsing dot */}
                  {isLiveItem && !active && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2" aria-hidden="true">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-court-green opacity-50" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-court-green" />
                    </span>
                  )}
                </motion.span>

                {/* Label */}
                <span
                  className={[
                    "text-[10px] leading-tight transition-all duration-150",
                    active
                      ? "font-semibold text-court-green"
                      : "font-medium text-text-muted",
                  ].join(" ")}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* iOS safe-area padding */}
      <div className="h-safe-bottom" aria-hidden="true" />
    </nav>
  );
}
