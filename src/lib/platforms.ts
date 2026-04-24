import { Platform } from "@prisma/client";

// Platform colors using low-opacity brand colors with solid borders (Stitch design)
export const PLATFORM_META: Record<
  Platform,
  { label: string; color: string; dotColor: string }
> = {
  youtube: {
    label: "YouTube",
    color: "bg-red-500/10 text-red-400 border border-red-500/20",
    dotColor: "bg-red-500",
  },
  github: {
    label: "GitHub",
    color: "bg-white/5 text-[#f2dfd5] border border-white/10",
    dotColor: "bg-white",
  },
  linkedin: {
    label: "LinkedIn",
    color: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
    dotColor: "bg-sky-500",
  },
  instagram: {
    label: "Instagram",
    color: "bg-pink-500/10 text-pink-400 border border-pink-500/20",
    dotColor: "bg-pink-500",
  },
  manual: {
    label: "Manual",
    color: "bg-[#FF8C42]/10 text-[#FFB68D] border border-[#FF8C42]/20",
    dotColor: "bg-[#FF8C42]",
  },
};

export { Platform };
