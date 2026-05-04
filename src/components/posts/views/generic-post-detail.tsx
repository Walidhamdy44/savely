"use client";

import { cn } from "@/lib/utils";
import { PLATFORM_META } from "@/lib/constants/platforms";
import { SharedDetailShell } from "../shared-detail-shell";
import type { PlatformViewProps } from "../types";

/**
 * Generic post detail view for platforms without a dedicated view (github, manual).
 * Renders basic post content — title, description, and thumbnail — inside SharedDetailShell.
 */
export function GenericPostDetail({
  post,
  notes,
  onDelete,
  onAddNote,
  onDeleteNote,
  isAddingNote,
}: PlatformViewProps) {
  const meta = PLATFORM_META[post.platform];

  return (
    <SharedDetailShell
      post={post}
      notes={notes}
      onDelete={onDelete}
      onAddNote={onAddNote}
      onDeleteNote={onDeleteNote}
      isAddingNote={isAddingNote}
    >
      {/* Platform badge */}
      <div className="flex items-center justify-end mb-6">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            meta.color,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotColor)} />
          {meta.label}
        </span>
      </div>

      {/* Post title */}
      <h2 className="text-lg font-semibold text-[#f2dfd5] mb-3">
        {post.title}
      </h2>

      {/* Description */}
      {post.description && (
        <p className="mb-6 text-base leading-[1.7] text-[#ddc1b3] whitespace-pre-wrap">
          {post.description}
        </p>
      )}

      {/* Thumbnail image */}
      {post.thumbnail && (
        <div className="mb-6 overflow-hidden rounded-2xl">
          <img
            src={post.thumbnail}
            alt={post.title}
            className="w-full object-cover"
          />
        </div>
      )}
    </SharedDetailShell>
  );
}
