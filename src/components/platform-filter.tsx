"use client";

import { Platform } from "@prisma/client";
import { PLATFORM_META } from "@/lib/platforms";
import { Badge } from "@/components/ui/badge";
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
      <button
        onClick={() => onSelect(undefined)}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
          selected === undefined
            ? "border-foreground bg-foreground text-background"
            : "border-border hover:bg-muted",
        )}
      >
        All
        {allCount > 0 && (
          <Badge
            variant="secondary"
            className="h-4 rounded-full px-1.5 text-xs"
          >
            {allCount}
          </Badge>
        )}
      </button>

      {Object.values(Platform).map((platform) => {
        const meta = PLATFORM_META[platform];
        const count = counts?.find((c) => c.platform === platform)?.count ?? 0;

        return (
          <button
            key={platform}
            onClick={() => onSelect(platform)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              selected === platform
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:bg-muted",
            )}
          >
            {meta.label}
            {count > 0 && (
              <Badge
                variant="secondary"
                className="h-4 rounded-full px-1.5 text-xs"
              >
                {count}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}
