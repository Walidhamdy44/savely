"use client";

import { useTRPC } from "@/trpc/client";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import type { Platform } from "@/lib/constants/platforms";

/** Input options for the posts query hook. */
interface UsePostsQueryOptions {
  /** Filter posts by platform. */
  platform?: Platform;
  /** Search string to filter posts by title, description, author, or URL. */
  search?: string;
  /** Number of posts per page. Defaults to 20. */
  limit?: number;
}

/**
 * Wraps `trpc.posts.getAll` with infinite cursor-based pagination.
 *
 * @param options - Optional filters for platform, search, and page size
 * @returns Posts data, loading/error state, and pagination controls
 */
export function usePostsQuery(options: UsePostsQueryOptions = {}) {
  const trpc = useTRPC();
  const { platform, search, limit = 20 } = options;

  const query = useInfiniteQuery(
    trpc.posts.getAll.infiniteQueryOptions(
      { platform, search, limit },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      },
    ),
  );

  const posts = query.data?.pages.flatMap((page) => page.posts) ?? [];

  return {
    /** Flattened array of all loaded posts across pages. */
    posts,
    /** Whether the initial page is loading. */
    isLoading: query.isLoading,
    /** Error object if the query failed. */
    error: query.error,
    /** Whether more pages are available. */
    hasNextPage: query.hasNextPage ?? false,
    /** Fetch the next page of results. */
    fetchNextPage: query.fetchNextPage,
    /** Whether a subsequent page is currently being fetched. */
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
