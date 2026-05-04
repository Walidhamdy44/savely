import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { GitHubPage } from "@/components/github/github-page";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default async function GitHubDashboardPage() {
  try {
    prefetch(trpc.github.getConnection.queryOptions());
    prefetch(trpc.github.getSavedRepoIds.queryOptions());
  } catch {
    // Client will retry
  }

  return (
    <HydrateClient>
      <ErrorBoundary>
        <GitHubPage />
      </ErrorBoundary>
    </HydrateClient>
  );
}
