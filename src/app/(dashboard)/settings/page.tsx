import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { ApiTokens } from "@/components/api-tokens";
import { ImportJson } from "@/components/import-json";

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
        <ImportJson />

        {/* API Tokens */}
        <ApiTokens />
      </div>
    </HydrateClient>
  );
}
