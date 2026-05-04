"use client";

import { useState } from "react";
import { useGitHubQuery } from "@/hooks/use-github-query";
import { useGitHubMutation } from "@/hooks/use-github-mutation";
import { GitHubConnect } from "@/components/github/github-connect";
import { GitHubProfile } from "@/components/github/github-profile";
import { GitHubRepoGrid } from "@/components/github/github-repo-grid";
import { Search, X } from "lucide-react";

const TABS = [
  { id: "starred" as const, label: "Starred Repos" },
  { id: "repos" as const, label: "My Repos" },
];

/** GitHub page composition root with connection, profile, tabs, and repo grid. */
export function GitHubPage() {
  const [activeTab, setActiveTab] = useState<"starred" | "repos">("starred");
  const [searchInput, setSearchInput] = useState("");

  const { connection, repos, savedIds, isLoading, isConnectionLoading } =
    useGitHubQuery({ tab: activeTab, search: searchInput });
  const { disconnect } = useGitHubMutation();

  if (isConnectionLoading) {
    return <PageSkeleton />;
  }

  if (!connection) {
    return <GitHubConnect />;
  }

  return (
    <div className="space-y-8">
      <PageHeader />

      <GitHubProfile
        connection={connection}
        onDisconnect={() => disconnect.mutate()}
        isDisconnecting={disconnect.isPending}
      />

      <TabBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearchInput("");
        }}
      />

      <SearchInput value={searchInput} onChange={setSearchInput} />

      <GitHubRepoGrid
        repos={repos}
        savedIds={savedIds}
        isLoading={isLoading}
        search={searchInput}
        tab={activeTab}
      />
    </div>
  );
}

/** GitHub page header with icon and title. */
function PageHeader() {
  return (
    <div className="flex items-center gap-3">
      <GitHubIcon />
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#f2dfd5]">
          GitHub
        </h1>
        <p className="text-sm text-[#a48c7f]">
          Browse and save repositories from GitHub
        </p>
      </div>
    </div>
  );
}

/** Loading skeleton for the page. */
function PageSkeleton() {
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

/** Tab bar for switching between starred and user repos. */
function TabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: "starred" | "repos";
  onTabChange: (tab: "starred" | "repos") => void;
}) {
  return (
    <div className="flex items-center gap-6 border-b border-[rgba(255,255,255,0.06)]">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
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
  );
}

/** Search input for filtering repositories. */
function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#564338]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search repositories…"
        className="h-10 w-full rounded-xl bg-[#281d18] pl-10 pr-9 text-sm text-[#f2dfd5] placeholder:text-[#564338] border border-[rgba(255,255,255,0.04)] outline-none transition-all focus:border-[#FF8C42]/40 focus:ring-1 focus:ring-[#FF8C42]/20"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#564338] hover:text-[#a48c7f]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/** GitHub SVG icon. */
function GitHubIcon() {
  return (
    <svg
      className="h-7 w-7 text-[#f2dfd5]"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}
