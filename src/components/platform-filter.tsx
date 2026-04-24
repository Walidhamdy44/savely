"use client";

import { Platform } from "@prisma/client";
import { PLATFORM_META } from "@/lib/platforms";
import { cn } from "@/lib/utils";

type Props = {
  selected: Platform | undefined;
  onSelect: (platform: Platform | undefined) => void;
  counts?: { platform: Platform; count: number }[];
};

export function PlatformFilter({ selected, onSelect, counts }: Props) {
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
      {Object.values(Platform).map((platform) => {
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
