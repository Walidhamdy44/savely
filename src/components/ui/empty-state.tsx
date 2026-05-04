"use client";

import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

/** Props for the EmptyState component. */
interface EmptyStateProps {
  /** Icon element displayed above the title. */
  icon: ReactElement;
  /** Primary heading text. */
  title: string;
  /** Supporting description text. */
  description: string;
  /** Optional call-to-action element (e.g. a button). */
  action?: ReactElement;
  className?: string;
}

/**
 * Reusable empty state component for when a data-fetching request
 * returns an empty result set. Accepts an icon, title, description,
 * and an optional action element.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-[#564338] bg-[#281d18]/50 py-24 text-center",
        className,
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#332822]">
        {icon}
      </div>
      <div className="space-y-1.5">
        <p className="text-lg font-semibold text-[#a48c7f]">{title}</p>
        <p className="max-w-xs text-sm text-[#564338]">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
