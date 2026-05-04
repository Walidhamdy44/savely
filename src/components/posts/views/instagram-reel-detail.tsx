"use client";

import { useState } from "react";
import {
  Calendar,
  ExternalLink,
  Play,
  Link2,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORM_META } from "@/lib/constants/platforms";
import { SharedDetailShell } from "../shared-detail-shell";
import type { PlatformViewProps } from "../types";

/** Maximum caption length before showing "Read more" toggle. */
const CAPTION_TRUNCATE_LENGTH = 300;

/**
 * Determine whether an Instagram post is a Reel based on its URL.
 * Reels have `/reel/` in the path; regular posts use `/p/`.
 */
function isReel(url: string): boolean {
  return url.includes("/reel/");
}

/**
 * Build the Instagram embed URL from a post/reel URL.
 * Instagram supports embedding via appending `/embed/` to the post URL.
 * e.g. https://www.instagram.com/reel/ABC123/embed/
 */
function getEmbedUrl(url: string): string | null {
  // Match /p/{shortcode} or /reel/{shortcode}
  const match = url.match(/instagram\.com\/(p|reel)\/([^/?]+)/);
  if (!match) return null;
  const [, type, shortcode] = match;
  return `https://www.instagram.com/${type}/${shortcode}/embed/`;
}

/**
 * Instagram-specific reel/post detail view.
 *
 * Renders the post with an embedded Instagram player:
 * - Native Instagram embed iframe for reels and posts
 * - Fallback to thumbnail with play button if embed fails
 * - Author section with username
 * - Expandable caption with "Read more"
 * - Copy link action
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
  const reel = isReel(post.url);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [embedError, setEmbedError] = useState(false);

  const embedUrl = getEmbedUrl(post.url);
  const caption = post.description || "";
  const needsTruncation = caption.length > CAPTION_TRUNCATE_LENGTH;
  const displayCaption =
    needsTruncation && !captionExpanded
      ? caption.slice(0, CAPTION_TRUNCATE_LENGTH) + "…"
      : caption;

  const authorName = post.authorName || post.title || "Instagram User";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(post.url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Clipboard API may fail in some contexts
    }
  };

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

      {/* Instagram embed or fallback */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-[#1b110c]">
        {embedUrl && !embedError ? (
          /* Native Instagram embed iframe */
          <div className="mx-auto w-full max-w-[540px]">
            <iframe
              src={embedUrl}
              title={post.title}
              className={cn(
                "w-full border-0",
                reel ? "min-h-[700px]" : "min-h-[550px]",
              )}
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              onError={() => setEmbedError(true)}
              loading="lazy"
              style={{ background: "#1b110c" }}
            />
          </div>
        ) : (
          /* Fallback: thumbnail with play overlay */
          <div
            className={cn(
              "relative mx-auto w-full max-w-[480px]",
              reel ? "aspect-[9/16]" : "aspect-square",
            )}
          >
            {post.thumbnail ? (
              <img
                src={post.thumbnail}
                alt={post.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-[#564338]">
                No preview available
              </div>
            )}

            {/* Play button overlay for Reels */}
            {reel && post.thumbnail && (
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors hover:bg-black/30"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform hover:scale-110">
                  <Play className="h-7 w-7 text-white ml-1" fill="white" />
                </div>
              </a>
            )}

            {/* Embed error notice */}
            {embedError && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1.5 text-xs text-[#a48c7f] backdrop-blur-sm">
                <AlertCircle className="h-3 w-3" />
                Embed unavailable
              </div>
            )}

            {/* "Open on Instagram" overlay button at bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E1306C] to-[#C13584] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                <ExternalLink className="h-4 w-4" />
                Open on Instagram
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Author section */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#E1306C] to-[#C13584] text-sm font-bold text-white">
          {authorName[0]?.toUpperCase() || "?"}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#f2dfd5]">{authorName}</p>
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#a48c7f] hover:text-[#E1306C] transition-colors"
          >
            View on Instagram
          </a>
        </div>
      </div>

      {/* Caption */}
      {caption && (
        <div className="mb-6">
          <p
            className="text-base leading-[1.8] text-[#f2dfd5] whitespace-pre-wrap"
            dir="auto"
          >
            {displayCaption}
          </p>
          {needsTruncation && (
            <button
              onClick={() => setCaptionExpanded(!captionExpanded)}
              className="mt-1 text-sm font-medium text-[#a48c7f] hover:text-[#f2dfd5] transition-colors"
            >
              {captionExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      {/* Copy link action */}
      <div className="mb-4">
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#a48c7f] transition-colors hover:bg-[#332822] hover:text-[#f2dfd5]"
        >
          {linkCopied ? (
            <>
              <Check className="h-4 w-4 text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4" />
              Copy link
            </>
          )}
        </button>
      </div>
    </SharedDetailShell>
  );
}
