"use client";

import { Star, GitFork, Check, Bookmark, Loader2 } from "lucide-react";
import { LANG_COLORS } from "@/lib/constants/platforms";
import { formatCount, timeAgo } from "@/lib/utils";
import type { GitHubRepo } from "@/types/github";

type Props = {
  repo: GitHubRepo;
  isSaved: boolean;
  onSave: () => void;
  onUnsave: () => void;
  isSaving: boolean;
  isUnsaving: boolean;
};

/** A single GitHub repository card with save/unsave actions. */
export function GitHubRepoCard({
  repo,
  isSaved,
  onSave,
  onUnsave,
  isSaving,
  isUnsaving,
}: Props) {
  const langColor = repo.language
    ? LANG_COLORS[repo.language] || "#a48c7f"
    : null;

  return (
    <div className="group flex flex-col rounded-3xl bg-[#281d18] p-6 transition-all duration-200 hover:bg-[#332822]">
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

      {repo.description && (
        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-[#a48c7f]">
          {repo.description}
        </p>
      )}

      <RepoTopics topics={repo.topics} />

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

      <SaveButton
        isSaved={isSaved}
        onSave={onSave}
        onUnsave={onUnsave}
        isSaving={isSaving}
        isUnsaving={isUnsaving}
      />
    </div>
  );
}

/** Render topic badges for a repo. */
function RepoTopics({ topics }: { topics: string[] }) {
  if (topics.length === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      {topics.slice(0, 4).map((topic) => (
        <span
          key={topic}
          className="rounded-full bg-[#FF8C42]/8 px-2 py-0.5 text-[10px] font-medium text-[#FFB68D]"
        >
          {topic}
        </span>
      ))}
      {topics.length > 4 && (
        <span className="rounded-full bg-[#332822] px-2 py-0.5 text-[10px] text-[#564338]">
          +{topics.length - 4}
        </span>
      )}
    </div>
  );
}

/** Save/unsave toggle button for a repo card. */
function SaveButton({
  isSaved,
  onSave,
  onUnsave,
  isSaving,
  isUnsaving,
}: {
  isSaved: boolean;
  onSave: () => void;
  onUnsave: () => void;
  isSaving: boolean;
  isUnsaving: boolean;
}) {
  if (isSaved) {
    return (
      <div className="mt-4">
        <button
          onClick={onUnsave}
          disabled={isUnsaving}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#FF8C42]/10 text-xs font-medium text-[#FF8C42] transition-colors hover:bg-[#FF8C42]/20"
        >
          <Check className="h-3.5 w-3.5" />
          Saved to Savely
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <button
        onClick={onSave}
        disabled={isSaving}
        className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#332822] text-xs font-medium text-[#a48c7f] transition-colors hover:bg-[#FF8C42] hover:text-[#532200]"
      >
        {isSaving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Bookmark className="h-3.5 w-3.5" />
        )}
        Save to Savely
      </button>
    </div>
  );
}
