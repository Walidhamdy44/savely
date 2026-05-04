"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { mapTRPCErrorToMessage } from "@/lib/errors/error-messages";

/**
 * Wraps save, delete, and deleteByExternalId post mutations
 * with toast error handling via `mapTRPCErrorToMessage`.
 *
 * @returns Mutation functions for saving, deleting, and deleting posts by external ID
 */
export function usePostsMutation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const save = useMutation(
    trpc.posts.save.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: [["posts"]] });
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
    trpc.posts.delete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: [["posts"]] });
      },
      onError: (error) => {
        const message = mapTRPCErrorToMessage(
          error.data?.code ?? "INTERNAL_SERVER_ERROR",
        );
        toast.error(message);
      },
    }),
  );

  const deleteByExternalId = useMutation(
    trpc.posts.deleteByExternalId.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: [["posts"]] });
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
    /** Save (upsert) a post. */
    save,
    /** Delete a post by its internal ID. */
    delete: deleteMutation,
    /** Delete a post by platform and external ID. */
    deleteByExternalId,
  };
}
