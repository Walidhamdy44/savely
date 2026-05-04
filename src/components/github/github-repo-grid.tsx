"use client";

import { useGitHubMutation } from "@/hooks/use-github-mutation";
import { GitHubRepoCard } from "@/components/github/github-repo-card";
import type { GitHubRepo } from "@/types/github";

type Props = {
  repos: GitHubRepo[];
  savedIds: number[];
  isLoading: boolean;
  search: string;
  tab: "starred" | "repos";
};

/** Grid layout for GitHub repositories with loading and empty states. */
export function GitHubRepoGrid({
  repos,
  savedIds,
  isLoading,
  search,
  tab,
}: Props) {
  const { saveRepo, unsaveRepo } = useGitHubMutation();

  if (isLoading) {
    return <RepoGridSkeleton />;
  }

  if (repos.length === 0) {
    return <RepoGridEmpty search={search} tab={tab} />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {repos.map((repo) => (
        <GitHubRepoCard
          key={repo.id}
          repo={repo}
          isSaved={savedIds.includes(repo.id)}
          onSave={() =>
            saveRepo.mutate({
              repoId: repo.id,
              name: repo.name,
              fullName: repo.fullName,
              description: repo.description,
              url: repo.url,
              language: repo.language,
              stars: repo.stars,
              forks: repo.forks,
              topics: repo.topics,
              ownerLogin: repo.ownerLogin,
              ownerAvatar: repo.ownerAvatar,
            })
          }
          onUnsave={() => unsaveRepo.mutate({ repoId: repo.id })}
          isSaving={saveRepo.isPending}
          isUnsaving={unsaveRepo.isPending}
        />
      ))}
    </div>
  );
}

/** Skeleton loading state for the repo grid. */
function RepoGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-4 rounded-3xl bg-[#281d18] p-6"
        >
          <div className="h-5 w-3/4 animate-pulse rounded-lg bg-[#332822]" />
          <div className="h-4 w-full animate-pulse rounded-lg bg-[#332822]" />
          <div className="h-4 w-1/2 animate-pulse rounded-lg bg-[#332822]" />
        </div>
      ))}
    </div>
  );
}

/** Empty state when no repos are found. */
function RepoGridEmpty({
  search,
  tab,
}: {
  search: string;
  tab: "starred" | "repos";
}) {
  const emptyMessage = search
    ? `No repos matching "${search}".`
    : tab === "starred"
      ? "This user hasn't starred any repos yet."
      : "This user has no public repos.";

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-[#564338] bg-[#281d18]/50 py-20 text-center">
      <p className="text-lg font-semibold text-[#a48c7f]">
        {search ? "No repos found" : "No repositories"}
      </p>
      <p className="max-w-xs text-sm text-[#564338]">{emptyMessage}</p>
    </div>
  );
}
