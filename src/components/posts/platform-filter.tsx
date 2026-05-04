"use client";

import { type Platform, PLATFORM_META } from "@/lib/constants/platforms";
import { cn } from "@/lib/utils";

/** Props for the PlatformFilter component. */
type PlatformFilterProps = {
  /** Currently selected platform, or undefined for "All". */
  selected: Platform | undefined;
  /** Callback when a platform filter is selected. */
  onSelect: (platform: Platform | undefined) => void;
  /** Optional per-platform post counts. */
  counts?: { platform: Platform; count: number }[];
};

/**
 * Horizontal chip bar for filtering posts by platform.
 * Renders an "All" chip followed by one chip per platform with optional counts.
 */
export function PlatformFilter({
  selected,
  onSelect,
  counts,
}: PlatformFilterProps) {
  const allCount = counts?.reduce((acc, c) => acc + c.count, 0) ?? 0;

  return (
    <div className="flex flex-wrap gap-2">
      {/* All filter */}
      <button
        onClick={() => onSelect(undefined)}
        className={cn(
          "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
          selected === undefined
            ? "bg-[#FF8C42] text-[#532200] shadow-lg shadow-[#FF8C42]/20"
            : "bg-[#281d18] text-[#a48c7f] border border-[rgba(255,255,255,0.06)] hover:bg-[#332822] hover:text-[#f2dfd5]",
        )}
      >
        All
        {allCount > 0 && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              selected === undefined
                ? "bg-[#532200]/30 text-[#532200]"
                : "bg-white/5 text-[#a48c7f]",
            )}
          >
            {allCount}
          </span>
        )}
      </button>

      {/* Platform filters */}
      {(Object.keys(PLATFORM_META) as Platform[]).map((platform) => {
        const meta = PLATFORM_META[platform];
        const count = counts?.find((c) => c.platform === platform)?.count ?? 0;

        return (
          <button
            key={platform}
            onClick={() => onSelect(platform)}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
              selected === platform
                ? "bg-[#FF8C42] text-[#532200] shadow-lg shadow-[#FF8C42]/20"
                : "bg-[#281d18] text-[#a48c7f] border border-[rgba(255,255,255,0.06)] hover:bg-[#332822] hover:text-[#f2dfd5]",
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", meta.dotColor)} />
            {meta.label}
            {count > 0 && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  selected === platform
                    ? "bg-[#532200]/30 text-[#532200]"
                    : "bg-white/5 text-[#a48c7f]",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
