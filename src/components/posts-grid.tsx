"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Platform } from "@prisma/client";
import { PostCard } from "@/components/post-card";
import { PlatformFilter } from "@/components/platform-filter";
import { BookmarkX, Loader2, Search, X } from "lucide-react";
import type { SavedPost } from "@prisma/client";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function PostsGrid() {
  const trpc = useTRPC();
  const [platform, setPlatform] = useState<Platform | undefined>(undefined);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 700);
  const search = debouncedSearch.trim() || undefined;

  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const [allPosts, setAllPosts] = useState<SavedPost[]>([]);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const currentCursor = cursors[cursors.length - 1];

  const { data, isLoading } = useQuery(
    trpc.posts.getAll.queryOptions({
      platform,
      search,
      limit: 20,
      cursor: currentCursor,
    }),
  );

  const { data: countsData } = useQuery(trpc.posts.counts.queryOptions());

  // Reset when platform or search changes
  useEffect(() => {
    setCursors([undefined]);
    setAllPosts([]);
  }, [platform, search]);

  // Accumulate posts
  useEffect(() => {
    if (!data) return;

    if (currentCursor === undefined) {
      setAllPosts(data.posts);
    } else {
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
    <div className="space-y-6">
      {/* Search + Filter bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        {/* Search input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#564338]" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title, author, content…"
            className="h-10 w-full rounded-xl bg-[#281d18] pl-10 pr-9 text-sm text-[#f2dfd5] placeholder:text-[#564338] border border-[rgba(255,255,255,0.04)] outline-none transition-all focus:border-[#FF8C42]/40 focus:ring-1 focus:ring-[#FF8C42]/20"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#564338] hover:text-[#a48c7f] transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Platform filter chips */}
      <PlatformFilter
        selected={platform}
        onSelect={setPlatform}
        counts={countsData}
      />

      {/* Active search indicator */}
      {search && (
        <div className="flex items-center gap-2 text-sm text-[#a48c7f]">
          <Search className="h-3.5 w-3.5" />
          <span>
            Showing results for{" "}
            <span className="font-medium text-[#FFB68D]">
              &quot;{search}&quot;
            </span>
          </span>
          {!isLoading && (
            <span className="text-[#564338]">
              · {allPosts.length} {allPosts.length === 1 ? "result" : "results"}
            </span>
          )}
        </div>
      )}

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
            {search ? (
              <Search className="h-7 w-7 text-[#564338]" />
            ) : (
              <BookmarkX className="h-7 w-7 text-[#564338]" />
            )}
          </div>
          <div className="space-y-1.5">
            <p className="text-lg font-semibold text-[#a48c7f]">
              {search ? "No results found" : "No saved posts yet"}
            </p>
            <p className="max-w-xs text-sm text-[#564338]">
              {search
                ? `No posts matching "${search}"${platform ? ` in ${platform}` : ""}.`
                : platform
                  ? `You have no saved posts from ${platform}.`
                  : "Start saving content from YouTube, LinkedIn, or GitHub to see it here."}
            </p>
          </div>
          {search && (
            <button
              onClick={() => setSearchInput("")}
              className="mt-2 rounded-xl bg-[#332822] px-4 py-2 text-sm font-medium text-[#a48c7f] transition-colors hover:bg-[#3e322c] hover:text-[#f2dfd5]"
            >
              Clear search
            </button>
          )}
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
