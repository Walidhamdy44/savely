"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Platform } from "@prisma/client";
import { PostCard } from "@/components/post-card";
import { PlatformFilter } from "@/components/platform-filter";
import { BookmarkX, Loader2 } from "lucide-react";
import type { SavedPost } from "@prisma/client";

export function PostsGrid() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [platform, setPlatform] = useState<Platform | undefined>(undefined);
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const [allPosts, setAllPosts] = useState<SavedPost[]>([]);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Current cursor is the last one in the array
  const currentCursor = cursors[cursors.length - 1];

  const { data, isLoading } = useQuery(
    trpc.posts.getAll.queryOptions({
      platform,
      limit: 20,
      cursor: currentCursor,
    }),
  );

  const { data: countsData } = useQuery(trpc.posts.counts.queryOptions());

  // When platform changes, reset everything
  useEffect(() => {
    setCursors([undefined]);
    setAllPosts([]);
  }, [platform]);

  // When data arrives, accumulate posts
  useEffect(() => {
    if (!data) return;

    if (currentCursor === undefined) {
      // First page
      setAllPosts(data.posts);
    } else {
      // Append new page (avoid duplicates)
      setAllPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newPosts = data.posts.filter((p) => !existingIds.has(p.id));
        return [...prev, ...newPosts];
      });
    }
    setIsFetchingMore(false);
  }, [data, currentCursor]);

  const hasNextPage = !!data?.nextCursor;

  const fetchNextPage = useCallback(() => {
    if (!data?.nextCursor || isFetchingMore) return;
    setIsFetchingMore(true);
    setCursors((prev) => [...prev, data.nextCursor]);
  }, [data?.nextCursor, isFetchingMore]);

  // Intersection observer for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry.isIntersecting &&
          hasNextPage &&
          !isFetchingMore &&
          !isLoading
        ) {
          fetchNextPage();
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingMore, isLoading, fetchNextPage]);

  return (
    <div className="space-y-8">
      {/* Platform filter bar */}
      <PlatformFilter
        selected={platform}
        onSelect={setPlatform}
        counts={countsData}
      />

      {/* Loading skeletons — first page only */}
      {isLoading && allPosts.length === 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col overflow-hidden rounded-3xl bg-[#281d18] border border-[rgba(255,255,255,0.04)]"
            >
              <div className="m-4 mb-0 rounded-2xl bg-[#1b110c]">
                <div className="aspect-video w-full animate-pulse rounded-2xl bg-[#332822]" />
              </div>
              <div className="space-y-3 p-5">
                <div className="h-4 w-3/4 animate-pulse rounded-lg bg-[#332822]" />
                <div className="h-3 w-1/2 animate-pulse rounded-lg bg-[#332822]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && allPosts.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-[#564338] bg-[#281d18]/50 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#332822]">
            <BookmarkX className="h-7 w-7 text-[#564338]" />
          </div>
          <div className="space-y-1.5">
            <p className="text-lg font-semibold text-[#a48c7f]">
              No saved posts yet
            </p>
            <p className="max-w-xs text-sm text-[#564338]">
              {platform
                ? `You have no saved posts from ${platform}.`
                : "Start saving content from YouTube, LinkedIn, or GitHub to see it here."}
            </p>
          </div>
        </div>
      )}

      {/* Post cards */}
      {allPosts.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Sentinel element for infinite scroll */}
      <div ref={sentinelRef} className="h-1" />

      {/* Loading more indicator */}
      {isFetchingMore && (
        <div className="flex items-center justify-center gap-2 py-6">
          <Loader2 className="h-5 w-5 animate-spin text-[#FF8C42]" />
          <span className="text-sm text-[#a48c7f]">Loading more…</span>
        </div>
      )}

      {/* End of list */}
      {allPosts.length > 0 && !hasNextPage && !isLoading && (
        <p className="text-center text-sm text-[#564338]">
          You&apos;ve reached the end.
        </p>
      )}
    </div>
  );
}
