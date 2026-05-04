"use client";

import { MessageCircle } from "lucide-react";

/** Shape of a single LinkedIn comment from the ScrapingDog API. */
interface LinkedInComment {
  name: string;
  text: string;
  date: string;
  headline: string;
  profileLink: string;
  interactions: number;
}

/** Props for the PostDetailComments component. */
interface PostDetailCommentsProps {
  comments: LinkedInComment[];
}

/** Formats a date into a relative "X days ago" string. */
function timeAgo(date: Date | string): string {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

/**
 * Displays LinkedIn comments fetched from the ScrapingDog API.
 * Only rendered when comments are available.
 */
export function PostDetailComments({ comments }: PostDetailCommentsProps) {
  if (comments.length === 0) return null;

  return (
    <div className="rounded-3xl bg-[#281d18] p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
          <MessageCircle className="h-4 w-4 text-sky-400" />
        </div>
        <h3 className="text-base font-semibold text-[#f2dfd5]">
          Comments ({comments.length})
        </h3>
      </div>

      <div className="space-y-4">
        {comments.map((comment, i) => (
          <div key={i} className="rounded-2xl bg-[#231914] p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#332822] text-xs font-bold text-[#a48c7f]">
                {comment.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <a
                    href={comment.profileLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[#f2dfd5] hover:text-[#FF8C42] transition-colors"
                  >
                    {comment.name}
                  </a>
                  {comment.headline && (
                    <span className="text-xs text-[#564338] truncate">
                      {comment.headline}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-[#ddc1b3] whitespace-pre-wrap">
                  {comment.text}
                </p>
                <div className="mt-2 flex items-center gap-3 text-[10px] text-[#564338]">
                  <span>{timeAgo(comment.date)}</span>
                  {comment.interactions > 0 && (
                    <span>👍 {comment.interactions}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
