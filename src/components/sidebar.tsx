"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  Bookmark,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "All Posts",
    icon: LayoutDashboard,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-border bg-[#231914] transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      {/* Logo + collapse toggle */}
      <div className="flex items-center justify-between px-4 py-5">
        <div
          className={cn(
            "flex items-center gap-3 overflow-hidden transition-all duration-300",
            collapsed ? "w-9" : "w-full",
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF8C42]">
            <Bookmark className="h-[18px] w-[18px] text-[#532200]" />
          </div>
          <span
            className={cn(
              "whitespace-nowrap text-base font-semibold tracking-tight text-[#f2dfd5] transition-all duration-300",
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
            )}
          >
            Content Hub
          </span>
        </div>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#a48c7f] transition-colors hover:bg-[#332822] hover:text-[#f2dfd5]",
            collapsed && "mx-auto",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Search */}
      <div className={cn("px-3 pb-4", collapsed && "px-2")}>
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl bg-[#1b110c] text-sm text-[#564338] transition-all duration-300",
            collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5",
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-[#a48c7f]" />
          <span
            className={cn(
              "whitespace-nowrap transition-all duration-300",
              collapsed
                ? "w-0 overflow-hidden opacity-0"
                : "w-auto opacity-100",
            )}
          >
            Search posts…
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-1", collapsed ? "px-2" : "px-3")}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-[#FF8C42]/10 text-[#FFB68D]"
                  : "text-[#a48c7f] hover:bg-[#332822] hover:text-[#f2dfd5]",
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-colors",
                  isActive
                    ? "text-[#FF8C42]"
                    : "text-[#a48c7f] group-hover:text-[#f2dfd5]",
                )}
              />
              <span
                className={cn(
                  "whitespace-nowrap transition-all duration-300",
                  collapsed
                    ? "w-0 overflow-hidden opacity-0"
                    : "w-auto opacity-100",
                )}
              >
                {item.label}
              </span>
              {/* Active indicator */}
              {isActive && !collapsed && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#FF8C42]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section at bottom */}
      <div className={cn("border-t border-border p-4", collapsed && "px-2")}>
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center",
          )}
        >
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
          <span
            className={cn(
              "whitespace-nowrap text-sm text-[#a48c7f] transition-all duration-300",
              collapsed
                ? "w-0 overflow-hidden opacity-0"
                : "w-auto opacity-100",
            )}
          >
            Account
          </span>
        </div>
      </div>
    </aside>
  );
}
