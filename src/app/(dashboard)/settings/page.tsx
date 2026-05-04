import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { ApiTokens } from "@/components/settings/api-tokens";
import { ImportJson } from "@/components/settings/import-json";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default async function SettingsPage() {
  try {
    prefetch(trpc.tokens.list.queryOptions());
  } catch {
    // Client will retry
  }

  return (
    <HydrateClient>
      <div className="space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-[#f2dfd5]">
            Settings
          </h1>
          <p className="text-sm text-[#a48c7f]">
            Import your saved content and manage API tokens.
          </p>
        </div>

        {/* Import JSON */}
        <ErrorBoundary>
          <ImportJson />
        </ErrorBoundary>

        {/* API Tokens */}
        <ErrorBoundary>
          <ApiTokens />
        </ErrorBoundary>
      </div>
    </HydrateClient>
  );
}
