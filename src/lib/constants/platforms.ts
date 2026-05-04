/**
 * Platform metadata and enum values.
 *
 * Moved from `src/lib/platforms.ts` to centralize all platform-related
 * constants in the shared constants directory.
 */

import { platformEnum } from "@/db/schema/enums";

/** Platform union type derived from the Drizzle pgEnum values. */
export type Platform = (typeof platformEnum.enumValues)[number];

/** Display metadata for each supported platform (label, badge colors, dot color). */
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

/** Language colors for GitHub repository language badges. */
export const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Lua: "#000080",
  Zig: "#ec915c",
};
