"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORM_META } from "@/lib/constants/platforms";
import { SharedDetailShell } from "../shared-detail-shell";
import type { PlatformViewProps } from "../types";

/**
 * YouTube-specific video detail view.
 * Renders an embedded YouTube player (with thumbnail fallback on error),
 * video title, channel name, description, and platform badge
 * inside SharedDetailShell.
 */
export function YouTubeVideoDetail({
  post,
  notes,
  onDelete,
  onAddNote,
  onDeleteNote,
  isAddingNote,
}: PlatformViewProps) {
  const meta = PLATFORM_META.youtube;
  const [iframeError, setIframeError] = useState(false);
  const embedUrl = `https://www.youtube.com/embed/${post.externalId}`;

  return (
    <SharedDetailShell
      post={post}
      notes={notes}
      onDelete={onDelete}
      onAddNote={onAddNote}
      onDeleteNote={onDeleteNote}
      isAddingNote={isAddingNote}
    >
      {/* YouTube platform badge */}
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

      {/* Embedded YouTube player or fallback thumbnail */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-[#1b110c]">
        {iframeError ? (
          <div className="relative aspect-video">
            {post.thumbnail && (
              <img
                src={post.thumbnail}
                alt={post.title}
                className="h-full w-full object-cover"
              />
            )}
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 flex items-center justify-center bg-black/50 transition-colors hover:bg-black/60"
            >
              <span className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white">
                <ExternalLink className="h-4 w-4" />
                Open on YouTube
              </span>
            </a>
          </div>
        ) : (
          <iframe
            src={embedUrl}
            title={post.title}
            className="aspect-video w-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            onError={() => setIframeError(true)}
          />
        )}
      </div>

      {/* Video title */}
      <h2 className="mb-3 text-lg font-semibold text-[#f2dfd5]">
        {post.title}
      </h2>

      {/* Channel name */}
      {post.authorName && (
        <p className="mb-4 text-sm text-[#a48c7f]">{post.authorName}</p>
      )}

      {/* Video description */}
      {post.description && (
        <p className="mb-6 text-base leading-[1.8] text-[#f2dfd5] whitespace-pre-wrap">
          {post.description}
        </p>
      )}
    </SharedDetailShell>
  );
}
