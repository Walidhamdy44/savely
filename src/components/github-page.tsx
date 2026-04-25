"use client";

import { useState, useEffect } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GitHubConnect } from "@/components/github-connect";
import { GitHubProfile } from "@/components/github-profile";
import { GitHubRepoGrid } from "@/components/github-repo-grid";
import { Search, X } from "lucide-react";

export function GitHubPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"starred" | "repos">("starred");
  const [searchInput, setSearchInput] = useState("");

  const { data: connection, isLoading: connectionLoading } = useQuery(
    trpc.github.getConnection.queryOptions(),
  );

  const { data: savedIds } = useQuery(
    trpc.github.getSavedRepoIds.queryOptions(),
  );

  const disconnectMutation = useMutation(
    trpc.github.disconnect.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["github"]] });
      },
    }),
  );

  if (connectionLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-1">
          <div className="h-8 w-32 animate-pulse rounded-lg bg-[#332822]" />
          <div className="h-4 w-64 animate-pulse rounded-lg bg-[#332822]" />
        </div>
        <div className="h-64 animate-pulse rounded-3xl bg-[#281d18]" />
      </div>
    );
  }

  if (!connection) {
    return <GitHubConnect />;
  }

  const tabs = [
    { id: "starred" as const, label: "Starred Repos" },
    { id: "repos" as const, label: "My Repos" },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
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
            Browse and save repositories from GitHub
          </p>
        </div>
      </div>

      {/* Profile card */}
      <GitHubProfile
        connection={connection}
        onDisconnect={() => disconnectMutation.mutate()}
        isDisconnecting={disconnectMutation.isPending}
      />

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-[rgba(255,255,255,0.06)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSearchInput("");
            }}
            className={`relative pb-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-[#FF8C42]"
                : "text-[#a48c7f] hover:text-[#f2dfd5]"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#FF8C42]" />
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#564338]" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search repositories…"
          className="h-10 w-full rounded-xl bg-[#281d18] pl-10 pr-9 text-sm text-[#f2dfd5] placeholder:text-[#564338] border border-[rgba(255,255,255,0.04)] outline-none transition-all focus:border-[#FF8C42]/40 focus:ring-1 focus:ring-[#FF8C42]/20"
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#564338] hover:text-[#a48c7f]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Repo grid */}
      <GitHubRepoGrid
        tab={activeTab}
        search={searchInput}
        savedIds={savedIds ?? []}
      />
    </div>
  );
}
