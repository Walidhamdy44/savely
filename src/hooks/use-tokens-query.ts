"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

/**
 * Wraps `trpc.tokens.list` to fetch the current user's API tokens.
 *
 * @returns Token list data, loading state, and error
 */
export function useTokensQuery() {
  const trpc = useTRPC();

  const query = useQuery(trpc.tokens.list.queryOptions());

  return {
    /** Array of API tokens (without the raw token value). */
    tokens: query.data,
    /** Whether the query is in its initial loading state. */
    isLoading: query.isLoading,
    /** Error object if the query failed. */
    error: query.error,
  };
}
