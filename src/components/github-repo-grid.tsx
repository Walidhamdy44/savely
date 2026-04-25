"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star, GitFork, Check, Bookmark, Loader2 } from "lucide-react";

// Language colors
const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Lua: "#000080",
  Zig: "#ec915c",
};

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

type Props = {
  tab: "starred" | "repos";
  search: string;
  savedIds: number[];
};

export function GitHubRepoGrid({ tab, search, savedIds }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: starredRepos, isLoading: starredLoading } = useQuery({
    ...trpc.github.getStarredRepos.queryOptions({
      search: search || undefined,
    }),
    enabled: tab === "starred",
  });

  const { data: userRepos, isLoading: reposLoading } = useQuery({
    ...trpc.github.getUserRepos.queryOptions({ search: search || undefined }),
    enabled: tab === "repos",
  });

  const saveMutation = useMutation(
    trpc.github.saveRepo.mutationOptions({
      onSuccess: () => {
        toast.success("Repo saved to Savely!");
        queryClient.invalidateQueries({
          queryKey: trpc.github.getSavedRepoIds.queryKey(),
        });
        queryClient.invalidateQueries({ queryKey: [["posts"]] });
      },
      onError: () => toast.error("Failed to save repo"),
    }),
  );

  const unsaveMutation = useMutation(
    trpc.github.unsaveRepo.mutationOptions({
      onSuccess: () => {
        toast.success("Repo removed");
        queryClient.invalidateQueries({
          queryKey: trpc.github.getSavedRepoIds.queryKey(),
        });
        queryClient.invalidateQueries({ queryKey: [["posts"]] });
      },
      onError: () => toast.error("Failed to remove repo"),
    }),
  );

  const repos = tab === "starred" ? starredRepos : userRepos;
  const isLoading = tab === "starred" ? starredLoading : reposLoading;

  if (isLoading) {
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

  if (!repos || repos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-[#564338] bg-[#281d18]/50 py-20 text-center">
        <p className="text-lg font-semibold text-[#a48c7f]">
          {search ? "No repos found" : "No repositories"}
        </p>
        <p className="max-w-xs text-sm text-[#564338]">
          {search
            ? `No repos matching "${search}".`
            : tab === "starred"
              ? "This user hasn't starred any repos yet."
              : "This user has no public repos."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {repos.map((repo) => {
        const isSaved = savedIds.includes(repo.id);
        const langColor = repo.language
          ? LANG_COLORS[repo.language] || "#a48c7f"
          : null;

        return (
          <div
            key={repo.id}
            className="group flex flex-col rounded-3xl bg-[#281d18] p-6 transition-all duration-200 hover:bg-[#332822]"
          >
            {/* Repo name */}
            <div className="mb-2 flex items-start justify-between gap-2">
              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-[#f2dfd5] hover:text-[#FF8C42] transition-colors"
              >
                <span className="text-[#564338]">{repo.ownerLogin}/</span>
                {repo.name}
              </a>
              {repo.archived && (
                <span className="shrink-0 rounded-full bg-[#564338]/20 px-2 py-0.5 text-[10px] text-[#564338]">
                  Archived
                </span>
              )}
            </div>

            {/* Description */}
            {repo.description && (
              <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-[#a48c7f]">
                {repo.description}
              </p>
            )}

            {/* Topics */}
            {repo.topics.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {repo.topics.slice(0, 4).map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full bg-[#FF8C42]/8 px-2 py-0.5 text-[10px] font-medium text-[#FFB68D]"
                  >
                    {topic}
                  </span>
                ))}
                {repo.topics.length > 4 && (
                  <span className="rounded-full bg-[#332822] px-2 py-0.5 text-[10px] text-[#564338]">
                    +{repo.topics.length - 4}
                  </span>
                )}
              </div>
            )}

            {/* Stats row */}
            <div className="mt-auto flex items-center gap-4 pt-3">
              {langColor && (
                <span className="flex items-center gap-1.5 text-[11px] text-[#a48c7f]">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: langColor }}
                  />
                  {repo.language}
                </span>
              )}
              <span className="flex items-center gap-1 text-[11px] text-[#a48c7f]">
                <Star className="h-3 w-3" />
                {formatCount(repo.stars)}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[#a48c7f]">
                <GitFork className="h-3 w-3" />
                {formatCount(repo.forks)}
              </span>
              <span className="ml-auto text-[10px] text-[#564338]">
                {timeAgo(repo.updatedAt)}
              </span>
            </div>

            {/* Save button */}
            <div className="mt-4">
              {isSaved ? (
                <button
                  onClick={() => unsaveMutation.mutate({ repoId: repo.id })}
                  disabled={unsaveMutation.isPending}
                  className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#FF8C42]/10 text-xs font-medium text-[#FF8C42] transition-colors hover:bg-[#FF8C42]/20"
                >
                  <Check className="h-3.5 w-3.5" />
                  Saved to Savely
                </button>
              ) : (
                <button
                  onClick={() =>
                    saveMutation.mutate({
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
                  disabled={saveMutation.isPending}
                  className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#332822] text-xs font-medium text-[#a48c7f] transition-colors hover:bg-[#FF8C42] hover:text-[#532200]"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Bookmark className="h-3.5 w-3.5" />
                  )}
                  Save to Savely
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
