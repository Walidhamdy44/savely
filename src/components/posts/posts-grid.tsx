"use client";

import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import type { Platform } from "@/lib/constants/platforms";
import { usePostsQuery } from "@/hooks/use-posts-query";
import { useDebounce } from "@/hooks/use-debounce";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { PostCard } from "./post-card";
import { PlatformFilter } from "./platform-filter";
import { CardSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { BookmarkX, Loader2, Search, X } from "lucide-react";

/**
 * Grid of saved posts with search, platform filtering, and infinite scroll.
 * Delegates data fetching to `usePostsQuery`, debouncing to `useDebounce`,
 * and scroll-based pagination to `useInfiniteScroll`.
 */
export function PostsGrid() {
  const trpc = useTRPC();
  const [platform, setPlatform] = useState<Platform | undefined>(undefined);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 700);
  const search = debouncedSearch.trim() || undefined;

  const { posts, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    usePostsQuery({ platform, search, limit: 20 });

  const { data: countsData } = useQuery(trpc.posts.counts.queryOptions());

  const { sentinelRef } = useInfiniteScroll({
    hasNextPage,
    isFetching: isFetchingNextPage || isLoading,
    onLoadMore: fetchNextPage,
  });

  return (
    <div className="space-y-6">
      <SearchBar value={searchInput} onChange={setSearchInput} />

      <PlatformFilter
        selected={platform}
        onSelect={setPlatform}
        counts={countsData}
      />

      {search && (
        <SearchIndicator
          search={search}
          count={posts.length}
          isLoading={isLoading}
          onClear={() => setSearchInput("")}
        />
      )}

      {isLoading && posts.length === 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && posts.length === 0 && (
        <PostsEmptyState
          search={search}
          platform={platform}
          onClearSearch={() => setSearchInput("")}
        />
      )}

      {posts.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex items-center justify-center gap-2 py-6">
          <Loader2 className="h-5 w-5 animate-spin text-[#FF8C42]" />
          <span className="text-sm text-[#a48c7f]">Loading more…</span>
        </div>
      )}

      {posts.length > 0 && !hasNextPage && !isLoading && (
        <p className="text-center text-sm text-[#564338]">
          You&apos;ve reached the end.
        </p>
      )}
    </div>
  );
}

/** Search input with clear button. */
function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#564338]" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search by title, author, content…"
          className="h-10 w-full rounded-xl bg-[#281d18] pl-10 pr-9 text-sm text-[#f2dfd5] placeholder:text-[#564338] border border-[rgba(255,255,255,0.04)] outline-none transition-all focus:border-[#FF8C42]/40 focus:ring-1 focus:ring-[#FF8C42]/20"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#564338] hover:text-[#a48c7f] transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Active search indicator with result count. */
function SearchIndicator({
  search,
  count,
  isLoading,
  onClear,
}: {
  search: string;
  count: number;
  isLoading: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-[#a48c7f]">
      <Search className="h-3.5 w-3.5" />
      <span>
        Showing results for{" "}
        <span className="font-medium text-[#FFB68D]">&quot;{search}&quot;</span>
      </span>
      {!isLoading && (
        <span className="text-[#564338]">
          · {count} {count === 1 ? "result" : "results"}
        </span>
      )}
    </div>
  );
}

/** Empty state for the posts grid. */
function PostsEmptyState({
  search,
  platform,
  onClearSearch,
}: {
  search: string | undefined;
  platform: Platform | undefined;
  onClearSearch: () => void;
}) {
  if (search) {
    return (
      <EmptyState
        icon={<Search className="h-7 w-7 text-[#564338]" />}
        title="No results found"
        description={`No posts matching "${search}"${platform ? ` in ${platform}` : ""}.`}
        action={
          <button
            onClick={onClearSearch}
            className="rounded-xl bg-[#332822] px-4 py-2 text-sm font-medium text-[#a48c7f] transition-colors hover:bg-[#3e322c] hover:text-[#f2dfd5]"
          >
            Clear search
          </button>
        }
      />
    );
  }

  return (
    <EmptyState
      icon={<BookmarkX className="h-7 w-7 text-[#564338]" />}
      title="No saved posts yet"
      description={
        platform
          ? `You have no saved posts from ${platform}.`
          : "Start saving content from YouTube, LinkedIn, or GitHub to see it here."
      }
    />
  );
}
