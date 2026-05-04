"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { mapTRPCErrorToMessage } from "@/lib/errors/error-messages";

/**
 * Wraps GitHub connect, disconnect, saveRepo, and unsaveRepo mutations
 * with toast error handling via `mapTRPCErrorToMessage`.
 *
 * @returns Mutation objects for GitHub connection and repo management
 */
export function useGitHubMutation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const connect = useMutation(
    trpc.github.connect.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: [["github"]] });
      },
      onError: (error) => {
        const message = mapTRPCErrorToMessage(
          error.data?.code ?? "INTERNAL_SERVER_ERROR",
        );
        toast.error(message);
      },
    }),
  );

  const disconnect = useMutation(
    trpc.github.disconnect.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: [["github"]] });
      },
      onError: (error) => {
        const message = mapTRPCErrorToMessage(
          error.data?.code ?? "INTERNAL_SERVER_ERROR",
        );
        toast.error(message);
      },
    }),
  );

  const saveRepo = useMutation(
    trpc.github.saveRepo.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.github.getSavedRepoIds.queryKey(),
        });
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

  const unsaveRepo = useMutation(
    trpc.github.unsaveRepo.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.github.getSavedRepoIds.queryKey(),
        });
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
    /** Connect a GitHub account by username. */
    connect,
    /** Disconnect the current GitHub account. */
    disconnect,
    /** Save a GitHub repo to Savely. */
    saveRepo,
    /** Remove a saved GitHub repo from Savely. */
    unsaveRepo,
  };
}
