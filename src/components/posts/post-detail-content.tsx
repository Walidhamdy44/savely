"use client";

import { Loader2, ExternalLink, MessageCircle } from "lucide-react";
import type { SavedPost } from "@/types/posts";

/** LinkedIn API data relevant to the content section. */
interface LinkedInContentData {
  content?: string | null;
  authorImage?: string | null;
  commentCount?: number;
  shareUrl?: string | null;
}

/** Props for the PostDetailContent component. */
interface PostDetailContentProps {
  post: SavedPost;
  linkedInData?: LinkedInContentData | null;
  isFetchingContent: boolean;
  fetchError: boolean;
}

/**
 * Renders the main content body of a post detail view.
 * Handles LinkedIn-specific loading/error states and
 * generic post content for other platforms.
 */
export function PostDetailContent({
  post,
  linkedInData,
  isFetchingContent,
  fetchError,
}: PostDetailContentProps) {
  return (
    <>
      <div className="mb-6">
        {post.platform === "linkedin" ? (
          <LinkedInContent
            post={post}
            linkedInData={linkedInData}
            isFetchingContent={isFetchingContent}
            fetchError={fetchError}
          />
        ) : (
          <GenericContent post={post} />
        )}
      </div>

      {/* Engagement stats */}
      {linkedInData &&
        (linkedInData.commentCount! > 0 || linkedInData.shareUrl) && (
          <div className="mb-6 flex items-center gap-4 text-xs text-[#a48c7f]">
            {linkedInData.commentCount! > 0 && (
              <span className="flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" />
                {linkedInData.commentCount} comments
              </span>
            )}
            {linkedInData.shareUrl && (
              <a
                href={linkedInData.shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-[#FF8C42] transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Share link
              </a>
            )}
          </div>
        )}

      {/* Non-LinkedIn thumbnail */}
      {post.thumbnail && post.platform !== "linkedin" && (
        <div className="mb-6 overflow-hidden rounded-2xl">
          <img
            src={post.thumbnail}
            alt={post.title}
            className="w-full object-cover"
          />
        </div>
      )}
    </>
  );
}

/** LinkedIn-specific content with loading, error, and success states. */
function LinkedInContent({
  post,
  linkedInData,
  isFetchingContent,
  fetchError,
}: PostDetailContentProps) {
  if (isFetchingContent) {
    return (
      <div className="flex items-center gap-3 py-8">
        <Loader2 className="h-5 w-5 animate-spin text-[#FF8C42]" />
        <span className="text-sm text-[#a48c7f]">
          Fetching post content from LinkedIn…
        </span>
      </div>
    );
  }

  if (linkedInData?.content) {
    return (
      <>
        <p className="text-base leading-[1.8] text-[#f2dfd5] whitespace-pre-wrap">
          {linkedInData.content}
        </p>
        {post.thumbnail && post.thumbnail !== linkedInData.authorImage && (
          <div className="mt-5 overflow-hidden rounded-2xl bg-[#1b110c]">
            <img
              src={post.thumbnail}
              alt="Post attachment"
              className="w-full object-contain max-h-[500px]"
            />
          </div>
        )}
      </>
    );
  }

  if (fetchError) {
    return (
      <div className="space-y-2">
        <p className="text-base leading-[1.7] text-[#f2dfd5] whitespace-pre-wrap">
          {post.description || post.title}
        </p>
        <p className="text-xs text-[#564338] mt-2">
          ⚠ Could not fetch full content from LinkedIn API.
        </p>
      </div>
    );
  }

  return (
    <p className="text-base leading-[1.7] text-[#f2dfd5] whitespace-pre-wrap">
      {post.description || post.title}
    </p>
  );
}

/** Generic content display for non-LinkedIn platforms. */
function GenericContent({ post }: { post: SavedPost }) {
  return (
    <>
      <h3 className="text-lg font-semibold text-[#f2dfd5] mb-2">
        {post.title}
      </h3>
      {post.description && (
        <p className="text-base leading-[1.7] text-[#ddc1b3] whitespace-pre-wrap">
          {post.description}
        </p>
      )}
    </>
  );
}
