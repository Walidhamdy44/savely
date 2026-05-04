"use client";

import { Users, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SavedPost } from "@/types/posts";
import { PLATFORM_META } from "@/lib/constants/platforms";

/** LinkedIn API data relevant to the header section. */
interface LinkedInData {
  authorName?: string | null;
  authorImage?: string | null;
  authorTitle?: string | null;
  authorUrl?: string | null;
  authorFollowers?: number;
  activityDate?: string | null;
}

/** Props for the PostDetailHeader component. */
interface PostDetailHeaderProps {
  post: SavedPost;
  linkedInData?: LinkedInData | null;
  metadata: Record<string, string> | null;
}

/**
 * Displays the author info section of a post detail view,
 * including avatar, name, job title, follower count, platform badge,
 * and activity date.
 */
export function PostDetailHeader({
  post,
  linkedInData,
  metadata,
}: PostDetailHeaderProps) {
  const meta = PLATFORM_META[post.platform];
  const authorImage = linkedInData?.authorImage || post.thumbnail;
  const authorName = linkedInData?.authorName || post.authorName || post.title;
  const authorTitle = linkedInData?.authorTitle || metadata?.authorJobTitle;
  const linkedInHandle = linkedInData?.authorUrl
    ?.split("/in/")[1]
    ?.replace(/\/$/, "");

  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        {authorImage ? (
          <img
            src={authorImage}
            alt={authorName}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#332822] text-lg font-bold text-[#a48c7f]">
            {authorName[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-[#f2dfd5]">
              {authorName}
            </h2>
            {linkedInHandle && (
              <a
                href={linkedInData?.authorUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#564338] hover:text-[#FF8C42] transition-colors"
              >
                @{linkedInHandle}
              </a>
            )}
          </div>
          {authorTitle && (
            <p className="text-sm text-[#a48c7f]">{authorTitle}</p>
          )}
          {linkedInData?.authorFollowers ? (
            <div className="mt-1 flex items-center gap-1 text-xs text-[#564338]">
              <Users className="h-3 w-3" />
              {linkedInData.authorFollowers.toLocaleString()} followers
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            meta.color,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotColor)} />
          {meta.label}
        </span>
        {linkedInData?.activityDate && (
          <div className="flex items-center gap-1 text-xs text-[#564338]">
            <Calendar className="h-3 w-3" />
            {new Date(linkedInData.activityDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        )}
      </div>
    </div>
  );
}
