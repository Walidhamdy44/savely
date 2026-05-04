"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { mapTRPCErrorToMessage } from "@/lib/errors/error-messages";

/**
 * Wraps create and delete token mutations
 * with toast error handling via `mapTRPCErrorToMessage`.
 *
 * @returns Mutation objects for creating and deleting API tokens, plus pending state
 */
export function useTokensMutation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const create = useMutation(
    trpc.tokens.create.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.tokens.list.queryKey(),
        });
      },
      onError: (error) => {
        const message = mapTRPCErrorToMessage(
          error.data?.code ?? "INTERNAL_SERVER_ERROR",
        );
        toast.error(message);
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.tokens.delete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.tokens.list.queryKey(),
        });
      },
      onError: (error) => {
        const message = mapTRPCErrorToMessage(
          error.data?.code ?? "INTERNAL_SERVER_ERROR",
        );
        toast.error(message);
      },
    }),
  );

  return {
    /** Create a new API token. */
    create,
    /** Delete an API token by ID. */
    delete: deleteMutation,
    /** Whether any mutation is currently pending. */
    isPending: create.isPending || deleteMutation.isPending,
  };
}
