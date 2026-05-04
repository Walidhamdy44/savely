"use client";

import { useRef, useEffect } from "react";

/** Options for configuring the infinite scroll hook. */
interface UseInfiniteScrollOptions {
  /** Whether more pages are available to load. */
  hasNextPage: boolean;
  /** Whether a fetch is currently in progress. */
  isFetching: boolean;
  /** Callback invoked when the sentinel element becomes visible. */
  onLoadMore: () => void;
  /** IntersectionObserver root margin. Defaults to "300px". */
  rootMargin?: string;
}

/** Return value of the useInfiniteScroll hook. */
interface UseInfiniteScrollReturn {
  /** Ref to attach to the sentinel element that triggers loading. */
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Observes a sentinel element and triggers `onLoadMore` when it enters the viewport.
 * Uses IntersectionObserver for efficient scroll-based pagination.
 *
 * @param options - Configuration for scroll behavior and load triggers
 * @returns An object containing the sentinelRef to attach to a DOM element
 *
 * **Validates: Requirements 3.6**
 */
export function useInfiniteScroll(
  options: UseInfiniteScrollOptions,
): UseInfiniteScrollReturn {
  const { hasNextPage, isFetching, onLoadMore, rootMargin = "300px" } = options;
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetching) {
          onLoadMore();
        }
      },
      { rootMargin },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching, onLoadMore, rootMargin]);

  return { sentinelRef };
}
