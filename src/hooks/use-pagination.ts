"use client";

import { useState, useCallback } from "react";

/** Options for configuring the pagination hook. */
interface UsePaginationOptions {
  /** Number of items per page. Defaults to 20. */
  limit?: number;
}

/** Return value of the usePagination hook. */
interface UsePaginationReturn {
  /** The current cursor for fetching the next page, or undefined for the first page. */
  cursor: string | undefined;
  /** Advance to the next page by providing the next cursor value. */
  setCursor: (nextCursor: string) => void;
  /** Reset pagination back to the first page. */
  reset: () => void;
  /** Whether more pages are available. Set via `setHasNextPage`. */
  hasNextPage: boolean;
  /** Update the hasNextPage flag based on the latest query response. */
  setHasNextPage: (value: boolean) => void;
}

/**
 * Manages cursor-based pagination state.
 * The cursor advances monotonically via `setCursor` and resets to `undefined` via `reset`.
 *
 * @param options - Optional configuration including page limit
 * @returns Pagination state and controls
 *
 * **Validates: Requirements 3.5**
 */
export function usePagination(
  options?: UsePaginationOptions,
): UsePaginationReturn {
  const [cursor, setCursorState] = useState<string | undefined>(undefined);
  const [hasNextPage, setHasNextPage] = useState(false);

  const setCursor = useCallback((nextCursor: string) => {
    setCursorState(nextCursor);
  }, []);

  const reset = useCallback(() => {
    setCursorState(undefined);
    setHasNextPage(false);
  }, []);

  return { cursor, setCursor, reset, hasNextPage, setHasNextPage };
}
