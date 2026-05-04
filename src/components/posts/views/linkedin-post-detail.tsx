"use client";

import { useRef, useEffect, useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Calendar,
  Loader2,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORM_META } from "@/lib/constants/platforms";
import { SharedDetailShell } from "../shared-detail-shell";
import { PostDetailComments } from "../post-detail-comments";
import type { PlatformViewProps } from "../types";

/** How long to wait before giving up on the LinkedIn API fetch (ms). */
const FETCH_TIMEOUT_MS = 10_000;

/**
 * LinkedIn-specific post detail view.
 * Fetches full post content from the LinkedIn API on mount and renders
 * author profile, post content, engagement stats, and comments.
 */
export function LinkedInPostDetail({
  post,
  notes,
  onDelete,
  onAddNote,
  onDeleteNote,
  isAddingNote,
}: PlatformViewProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  /* --- LinkedIn content fetch --- */
  const fetchContentMutation = useMutation(
    trpc.posts.fetchLinkedInContent.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.posts.getById.queryKey({ id: post.id }),
        });
      },
    }),
  );

  const hasFetchedRef = useRef(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (hasFetchedRef.current || fetchContentMutation.isPending) return;
    hasFetchedRef.current = true;
    fetchContentMutation.mutate({ postId: post.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  // Timeout: stop showing the loading state after FETCH_TIMEOUT_MS
  useEffect(() => {
    if (!fetchContentMutation.isPending) return;
    const timer = setTimeout(() => setTimedOut(true), FETCH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [fetchContentMutation.isPending]);

  const isFetching = fetchContentMutation.isPending && !timedOut;

  const apiData = fetchContentMutation.data;
  const metadata = post.metadata as Record<string, string> | null;
  const meta = PLATFORM_META[post.platform];

  /* Derive author fields from API response, falling back to stored data */
  const authorImage = apiData?.authorImage || post.thumbnail;
  const authorName = apiData?.authorName || post.authorName || post.title;
  const authorTitle = apiData?.authorTitle || metadata?.authorJobTitle;
  const linkedInHandle = apiData?.authorUrl
    ?.split("/in/")[1]
    ?.replace(/\/$/, "");

  return (
    <>
      <SharedDetailShell
        post={post}
        notes={notes}
        onDelete={onDelete}
        onAddNote={onAddNote}
        onDeleteNote={onDeleteNote}
        isAddingNote={isAddingNote}
        shareUrl={apiData?.shareUrl}
      >
        {/* Author profile section */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            {authorImage ? (
              <img
                src={authorImage}
                alt={authorName}
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#332822] text-lg font-bold text-[#a48c7f]">
                {authorName[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#f2dfd5]">
                  {authorName}
                </h2>
                {linkedInHandle && (
                  <a
                    href={apiData?.authorUrl ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#564338] hover:text-[#FF8C42] transition-colors"
                  >
                    @{linkedInHandle}
                  </a>
                )}
              </div>
              {authorTitle && (
                <p className="text-sm text-[#a48c7f]">{authorTitle}</p>
              )}
              {(apiData?.authorFollowers ?? 0) > 0 && (
                <div className="mt-1 flex items-center gap-1 text-xs text-[#564338]">
                  <Users className="h-3 w-3" />
                  {apiData!.authorFollowers.toLocaleString()} followers
                </div>
              )}
            </div>
          </div>

          {/* Platform badge + activity date */}
          <div className="flex flex-col items-end gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                meta.color,
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotColor)} />
              {meta.label}
            </span>
            {apiData?.activityDate && (
              <div className="flex items-center gap-1 text-xs text-[#564338]">
                <Calendar className="h-3 w-3" />
                {new Date(apiData.activityDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            )}
          </div>
        </div>

        {/* Post content with loading / error / success states */}
        <div className="mb-6">
          <LinkedInContent
            post={post}
            apiData={apiData}
            isFetching={isFetching}
            fetchError={fetchContentMutation.isError || timedOut}
          />
        </div>

        {/* Engagement stats */}
        {apiData && ((apiData.commentCount ?? 0) > 0 || apiData.shareUrl) && (
          <div className="mb-6 flex items-center gap-4 text-xs text-[#a48c7f]">
            {(apiData.commentCount ?? 0) > 0 && (
              <span className="flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" />
                {apiData.commentCount} comments
              </span>
            )}
            {apiData.shareUrl && (
              <a
                href={apiData.shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-[#FF8C42] transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Share link
              </a>
            )}
          </div>
        )}

        {/* Post thumbnail (when available and different from author image) */}
        {apiData?.content &&
          post.thumbnail &&
          post.thumbnail !== apiData.authorImage && (
            <div className="mt-5 overflow-hidden rounded-2xl bg-[#1b110c]">
              <img
                src={post.thumbnail}
                alt="Post attachment"
                className="w-full object-contain max-h-[500px]"
              />
            </div>
          )}
      </SharedDetailShell>

      {/* Comments rendered outside the shell, same layout as current post-detail.tsx */}
      <PostDetailComments comments={apiData?.comments ?? []} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Internal: LinkedIn content with loading, error, and success states */
/* ------------------------------------------------------------------ */

interface LinkedInContentProps {
  post: { description: string | null; title: string };
  apiData?: {
    content?: string | null;
    authorImage?: string | null;
  } | null;
  isFetching: boolean;
  fetchError: boolean;
}

function LinkedInContent({
  post,
  apiData,
  isFetching,
  fetchError,
}: LinkedInContentProps) {
  // If we have API content, show it
  if (apiData?.content) {
    return (
      <p className="text-base leading-[1.8] text-[#f2dfd5] whitespace-pre-wrap">
        {apiData.content}
      </p>
    );
  }

  // Show stored content immediately, with a subtle loading indicator if still fetching
  const storedContent = post.description || post.title;

  return (
    <div className="space-y-2">
      <p className="text-base leading-[1.7] text-[#f2dfd5] whitespace-pre-wrap">
        {storedContent}
      </p>
      {isFetching && (
        <div className="flex items-center gap-2 pt-1">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FF8C42]" />
          <span className="text-xs text-[#564338]">Fetching full content…</span>
        </div>
      )}
      {fetchError && !isFetching && (
        <p className="text-xs text-[#564338]">
          ⚠ Could not fetch full content from LinkedIn API.
        </p>
      )}
    </div>
  );
}
