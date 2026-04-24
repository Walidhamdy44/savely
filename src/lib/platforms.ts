import { Platform } from "@prisma/client";

// Human-readable labels and icons mapping for the UI (used in phase 3)
export const PLATFORM_META: Record<Platform, { label: string; color: string }> =
  {
    youtube: { label: "YouTube", color: "bg-red-100 text-red-700" },
    github: { label: "GitHub", color: "bg-gray-100 text-gray-700" },
    linkedin: { label: "LinkedIn", color: "bg-sky-100 text-sky-700" },
    instagram: { label: "Instagram", color: "bg-pink-100 text-pink-700" },
    manual: { label: "Manual", color: "bg-blue-100 text-blue-700" },
  };

export { Platform };
