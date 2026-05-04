"use client";

import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORM_META } from "@/lib/constants/platforms";
import { SharedDetailShell } from "../shared-detail-shell";
import type { PlatformViewProps } from "../types";

/**
 * Instagram-specific reel/post detail view.
 * Renders the post thumbnail as the primary visual, author name,
 * caption text, platform badge, and saved date inside SharedDetailShell.
 */
export function InstagramReelDetail({
  post,
  notes,
  onDelete,
  onAddNote,
  onDeleteNote,
  isAddingNote,
}: PlatformViewProps) {
  const meta = PLATFORM_META.instagram;

  return (
    <SharedDetailShell
      post={post}
      notes={notes}
      onDelete={onDelete}
      onAddNote={onAddNote}
      onDeleteNote={onDeleteNote}
      isAddingNote={isAddingNote}
    >
      {/* Platform badge + saved date */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-xs text-[#564338]">
          <Calendar className="h-3 w-3" />
          {new Date(post.savedAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </div>
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

      {/* Post thumbnail as primary visual */}
      {post.thumbnail && (
        <div className="mb-6 overflow-hidden rounded-2xl bg-[#1b110c]">
          <img
            src={post.thumbnail}
            alt={post.title}
            className="w-full object-cover"
          />
        </div>
      )}

      {/* Author name */}
      {post.authorName && (
        <h2 className="mb-3 text-lg font-semibold text-[#f2dfd5]">
          {post.authorName}
        </h2>
      )}

      {/* Caption / description */}
      {post.description && (
        <p className="mb-6 text-base leading-[1.8] text-[#f2dfd5] whitespace-pre-wrap">
          {post.description}
        </p>
      )}
    </SharedDetailShell>
  );
}
