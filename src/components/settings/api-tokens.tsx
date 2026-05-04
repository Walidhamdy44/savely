"use client";

import { useTokensQuery } from "@/hooks/use-tokens-query";
import { useTokensMutation } from "@/hooks/use-tokens-mutation";
import { ApiTokenList } from "@/components/settings/api-token-list";
import { ApiTokenCreateDialog } from "@/components/settings/api-token-create-dialog";
import { Key } from "lucide-react";

/**
 * Composition root for the API tokens settings section.
 * Combines token list display with create dialog using query and mutation hooks.
 */
export function ApiTokens() {
  const { tokens, isLoading } = useTokensQuery();
  const tokensMutation = useTokensMutation();

  /** Creates a token via the mutation hook and returns the result. */
  async function handleCreate(name: string) {
    return tokensMutation.create.mutateAsync({ name });
  }

  /** Deletes a token by ID via the mutation hook. */
  function handleDelete(id: string) {
    tokensMutation.delete.mutate({ id });
  }

  return (
    <div className="rounded-3xl border border-[rgba(255,255,255,0.04)] bg-[#281d18] p-6">
      <div className="flex items-center justify-between pb-6">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2.5 text-lg font-semibold text-[#f2dfd5]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF8C42]/10">
              <Key className="h-4 w-4 text-[#FF8C42]" />
            </div>
            API Tokens
          </h2>
          <p className="text-sm text-[#a48c7f]">
            Create tokens to sync data from the browser extension
          </p>
        </div>
        <ApiTokenCreateDialog
          onCreate={handleCreate}
          isPending={tokensMutation.create.isPending}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-[#564338]">Loading tokens...</p>
      ) : (
        <ApiTokenList tokens={tokens ?? []} onDelete={handleDelete} />
      )}
    </div>
  );
}
