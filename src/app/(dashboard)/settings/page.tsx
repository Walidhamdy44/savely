import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { ApiTokens } from "@/components/api-tokens";
import { ImportJson } from "@/components/import-json";

export default async function SettingsPage() {
  prefetch(trpc.tokens.list.queryOptions());

  return (
    <HydrateClient>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Import your saved content and manage API tokens.
          </p>
        </div>

        {/* Import JSON - Primary way to sync */}
        <ImportJson />

        {/* API Tokens - For advanced/automated sync */}
        <ApiTokens />
      </div>
    </HydrateClient>
  );
}
