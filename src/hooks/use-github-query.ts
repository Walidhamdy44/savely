"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

/** Input options for the GitHub query hook. */
interface UseGitHubQueryOptions {
  /** Which tab is active: "starred" or "repos". */
  tab: "starred" | "repos";
  /** Search string to filter repositories. */
  search?: string;
}

/**
 * Wraps GitHub connection, repos, and savedIds queries.
 * Fetches starred or user repos based on the active tab.
 *
 * @param options - Tab selection and optional search filter
 * @returns Connection status, repos list, saved IDs, and loading state
 */
export function useGitHubQuery(options: UseGitHubQueryOptions) {
  const trpc = useTRPC();
  const { tab, search } = options;

  const connectionQuery = useQuery(trpc.github.getConnection.queryOptions());

  const savedIdsQuery = useQuery(trpc.github.getSavedRepoIds.queryOptions());

  const starredQuery = useQuery({
    ...trpc.github.getStarredRepos.queryOptions({
      search: search || undefined,
    }),
    enabled: tab === "starred",
  });

  const userReposQuery = useQuery({
    ...trpc.github.getUserRepos.queryOptions({
      search: search || undefined,
    }),
    enabled: tab === "repos",
  });

  const repos = tab === "starred" ? starredQuery.data : userReposQuery.data;
  const reposLoading =
    tab === "starred" ? starredQuery.isLoading : userReposQuery.isLoading;

  return {
    /** The user's GitHub connection, or null/undefined if not connected. */
    connection: connectionQuery.data,
    /** List of repos for the active tab. */
    repos: repos ?? [],
    /** Array of saved GitHub repo IDs for quick lookup. */
    savedIds: savedIdsQuery.data ?? [],
    /** Whether any of the queries are in their initial loading state. */
    isLoading: connectionQuery.isLoading || reposLoading,
    /** Whether the connection query is loading. */
    isConnectionLoading: connectionQuery.isLoading,
  };
}
