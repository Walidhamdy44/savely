"use client";

import { cn } from "@/lib/utils";

/** Props shared by all skeleton variants. */
interface SkeletonProps {
  className?: string;
}

/**
 * Skeleton placeholder for a single card in a grid layout.
 * Mimics the PostCard shape with a thumbnail area and text lines.
 */
export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-3xl bg-[#281d18] border border-[rgba(255,255,255,0.04)]",
        className,
      )}
    >
      <div className="m-4 mb-0 rounded-2xl bg-[#1b110c]">
        <div className="aspect-video w-full animate-pulse rounded-2xl bg-[#332822]" />
      </div>
      <div className="space-y-3 p-5">
        <div className="h-4 w-3/4 animate-pulse rounded-lg bg-[#332822]" />
        <div className="h-3 w-1/2 animate-pulse rounded-lg bg-[#332822]" />
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder for a list of items.
 * Renders a configurable number of row-shaped placeholders.
 */
export function ListSkeleton({
  className,
  count = 5,
}: SkeletonProps & { count?: number }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-2xl bg-[#281d18] p-4 border border-[rgba(255,255,255,0.04)]"
        >
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-[#332822]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded-lg bg-[#332822]" />
            <div className="h-3 w-1/3 animate-pulse rounded-lg bg-[#332822]" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton placeholder for a detail view.
 * Mimics the PostDetail layout with header, content, and action areas.
 */
export function DetailSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="h-5 w-32 animate-pulse rounded-lg bg-[#332822]" />
      <div className="rounded-3xl bg-[#281d18] p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-14 w-14 animate-pulse rounded-full bg-[#332822]" />
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded-lg bg-[#332822]" />
            <div className="h-3 w-48 animate-pulse rounded-lg bg-[#332822]" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full animate-pulse rounded-lg bg-[#332822]" />
          <div className="h-4 w-5/6 animate-pulse rounded-lg bg-[#332822]" />
          <div className="h-4 w-3/4 animate-pulse rounded-lg bg-[#332822]" />
        </div>
        <div className="mt-8 flex items-center gap-2 pt-4 border-t border-[rgba(255,255,255,0.04)]">
          <div className="h-9 w-36 animate-pulse rounded-xl bg-[#332822]" />
          <div className="ml-auto h-9 w-24 animate-pulse rounded-xl bg-[#332822]" />
        </div>
      </div>
    </div>
  );
}
