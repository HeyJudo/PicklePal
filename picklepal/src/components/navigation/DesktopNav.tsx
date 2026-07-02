"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { ChevronLeft, Crown } from "lucide-react";
import {
  HomeIcon,
  LiveIcon,
  BoardIcon,
  HistoryIcon,
  PlayersIcon,
} from "@/components/icons";
import Logo from "@/components/Logo";

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
    { label: "Titles", href: `${base}/belts`, icon: <Crown className="w-5 h-5" /> },
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
      {/* Brand header — court-line texture + DinkDay wordmark */}
      <div className="relative overflow-hidden px-5 py-5 border-b border-border">
        {/* Subtle court-line texture in background */}
        <div
          className="absolute inset-0 opacity-[0.04] court-lines"
          aria-hidden="true"
        />
        {/* Back to groups */}
        <Link
          href="/app"
          className="relative flex items-center gap-1 text-[11px] font-medium text-text-muted hover:text-court-green transition-colors duration-150 mb-3 w-fit"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          My Groups
        </Link>
        {/* Wordmark */}
        <Logo size={48} />
      </div>

      {/* Game Day Active pill — shown on live page */}
      {isLivePage && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="mx-3 mt-3 rounded-xl bg-court-green px-3 py-2.5 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
            <span className="text-xs font-semibold text-white tracking-tight">
              Game Day Active
            </span>
          </div>
        </motion.div>
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
                  aria-current={active ? "page" : undefined}
                  className={[
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 overflow-hidden",
                    active
                      ? "text-white"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-muted",
                  ].join(" ")}
                >
                  {/* Animated active background pill */}
                  {active && (
                    <motion.span
                      layoutId="desktop-nav-active"
                      className="absolute inset-0 rounded-xl bg-court-green"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}

                  {/* Icon */}
                  <span
                    className={[
                      "relative z-10 shrink-0 transition-colors",
                      active ? "text-white" : "text-text-muted",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>

                  {/* Label */}
                  <span className="relative z-10">{item.label}</span>

                  {/* Live dot when not active */}
                  {item.label === "Live" && !active && (
                    <span
                      className="relative z-10 ml-auto h-2 w-2 rounded-full bg-court-green flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-court-green opacity-50" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-court-green" />
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <p className="text-[10px] text-text-muted font-medium">dinkday.app</p>
      </div>
    </aside>
  );
}
