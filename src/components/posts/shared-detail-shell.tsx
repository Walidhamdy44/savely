"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PostDetailActions } from "./post-detail-actions";
import { PostDetailNotes } from "./post-detail-notes";
import type { SavedPost, PostNote } from "@/types/posts";

/** Props for the SharedDetailShell layout wrapper. */
export interface SharedDetailShellProps {
  post: SavedPost;
  notes: PostNote[];
  onDelete: () => void;
  onAddNote: (input: { postId: string; content: string }) => void;
  onDeleteNote: (input: { noteId: string }) => void;
  isAddingNote: boolean;
  shareUrl?: string | null;
  children: React.ReactNode;
}

/**
 * Shared layout shell for all platform-specific detail views.
 * Wraps platform-specific content (children) with common UI:
 * back navigation, delete action, notes section, and metadata footer.
 */
export function SharedDetailShell({
  post,
  notes,
  onDelete,
  onAddNote,
  onDeleteNote,
  isAddingNote,
  shareUrl,
  children,
}: SharedDetailShellProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <BackButton onClick={() => router.push("/dashboard")} />

      <div className="rounded-3xl bg-[#281d18] p-8">
        {children}
        <PostDetailActions
          post={post}
          shareUrl={shareUrl}
          onDelete={onDelete}
        />
      </div>

      <PostDetailNotes
        postId={post.id}
        notes={notes}
        onAddNote={onAddNote}
        onDeleteNote={onDeleteNote}
        isAdding={isAddingNote}
      />

      {/* Metadata footer */}
      <div className="flex flex-wrap items-center gap-4 px-2 text-[10px] uppercase tracking-wider text-[#564338]">
        <span>Source: {post.sourceType.replace("_", " ")}</span>
        <span>·</span>
        <span>
          Saved{" "}
          {new Date(post.savedAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        <span>·</span>
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate max-w-[300px] hover:text-[#a48c7f] transition-colors"
        >
          {post.url}
        </a>
      </div>
    </div>
  );
}

/** Simple back navigation button. */
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-sm text-[#a48c7f] hover:text-[#f2dfd5] transition-colors"
    >
      <ArrowLeft className="h-4 w-4" /> Back to posts
    </button>
  );
}
