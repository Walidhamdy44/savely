"use client";

import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function GitHubConnect() {
  const [username, setUsername] = useState("");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const connectMutation = useMutation(
    trpc.github.connect.mutationOptions({
      onSuccess: () => {
        toast.success("GitHub connected!");
        queryClient.invalidateQueries({ queryKey: [["github"]] });
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <svg
          className="h-7 w-7 text-[#f2dfd5]"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#f2dfd5]">
            GitHub
          </h1>
          <p className="text-sm text-[#a48c7f]">
            Connect your GitHub account to import your starred repos and
            repositories
          </p>
        </div>
      </div>

      {/* Connect card */}
      <div className="mx-auto max-w-md">
        <div className="flex flex-col items-center gap-8 rounded-3xl bg-[#281d18] p-10 text-center">
          {/* GitHub logo */}
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#332822]">
            <svg
              className="h-10 w-10 text-[#f2dfd5]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-[#f2dfd5]">
              Connect to GitHub
            </h2>
            <p className="text-sm text-[#a48c7f]">
              Enter your GitHub username to get started
            </p>
          </div>

          {/* Username input */}
          <div className="w-full space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. vercel"
              onKeyDown={(e) => {
                if (e.key === "Enter" && username.trim()) {
                  connectMutation.mutate({ username: username.trim() });
                }
              }}
              className="h-11 w-full rounded-xl bg-[#14161a] px-4 text-sm text-[#f2dfd5] placeholder:text-[#564338] border border-[rgba(255,255,255,0.06)] outline-none transition-all focus:border-[#FF8C42] focus:ring-1 focus:ring-[#FF8C42]/20"
            />
            <button
              onClick={() => {
                if (username.trim()) {
                  connectMutation.mutate({ username: username.trim() });
                }
              }}
              disabled={!username.trim() || connectMutation.isPending}
              className="h-11 w-full rounded-xl bg-[#FF8C42] text-sm font-semibold text-[#532200] shadow-lg shadow-[#FF8C42]/20 transition-colors hover:bg-[#FFB68D] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connectMutation.isPending ? "Connecting…" : "Connect"}
            </button>
          </div>

          <p className="text-xs text-[#564338]">
            We only access public data. No authentication required.
          </p>
        </div>
      </div>
    </div>
  );
}
