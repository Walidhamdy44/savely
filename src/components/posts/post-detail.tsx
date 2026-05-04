"use client";

import { useRef, useEffect } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { DetailSkeleton } from "@/components/ui/loading-skeleton";
import { PostDetailHeader } from "./post-detail-header";
import { PostDetailContent } from "./post-detail-content";
import { PostDetailActions } from "./post-detail-actions";
import { PostDetailComments } from "./post-detail-comments";
import { PostDetailNotes } from "./post-detail-notes";

/** Props for the PostDetail composition root. */
type PostDetailProps = { postId: string };

/**
 * Composition root for the post detail view.
 * Handles all data fetching and delegates rendering to sub-components.
 */
export function PostDetail({ postId }: PostDetailProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: post, isLoading } = useQuery(
    trpc.posts.getById.queryOptions({ id: postId }),
  );

  const { data: notes = [] } = useQuery(
    trpc.notes.list.queryOptions({ postId }),
  );

  /* --- LinkedIn content fetch --- */
  const fetchContentMutation = useMutation(
    trpc.posts.fetchLinkedInContent.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.posts.getById.queryKey({ id: postId }),
        });
      },
    }),
  );

  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (
      !post ||
      post.platform !== "linkedin" ||
      hasFetchedRef.current ||
      fetchContentMutation.isPending
    )
      return;
    hasFetchedRef.current = true;
    fetchContentMutation.mutate({ postId: post.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id]);

  /* --- Delete mutation --- */
  const deleteMutation = useMutation(
    trpc.posts.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Post removed");
        void queryClient.invalidateQueries({ queryKey: [["posts"]] });
        router.push("/dashboard");
      },
      onError: () => toast.error("Failed to remove post"),
    }),
  );

  /* --- Note mutations --- */
  const addNoteMutation = useMutation(
    trpc.notes.create.mutationOptions({
      onSuccess: () => {
        toast.success("Note added");
        void queryClient.invalidateQueries({
          queryKey: trpc.notes.list.queryKey({ postId }),
        });
      },
      onError: () => toast.error("Failed to add note"),
    }),
  );

  const deleteNoteMutation = useMutation(
    trpc.notes.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Note deleted");
        void queryClient.invalidateQueries({
          queryKey: trpc.notes.list.queryKey({ postId }),
        });
      },
      onError: () => toast.error("Failed to delete note"),
    }),
  );

  if (isLoading) return <DetailSkeleton />;

  if (!post) {
    return (
      <div className="space-y-6">
        <BackButton onClick={() => router.push("/dashboard")} />
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-[#281d18] py-20 text-center">
          <p className="text-lg font-semibold text-[#a48c7f]">Post not found</p>
        </div>
      </div>
    );
  }

  const metadata = post.metadata as Record<string, string> | null;
  const apiData = fetchContentMutation.data;

  return (
    <div className="space-y-6">
      <BackButton onClick={() => router.push("/dashboard")} />

      <div className="rounded-3xl bg-[#281d18] p-8">
        <PostDetailHeader
          post={post}
          linkedInData={apiData}
          metadata={metadata}
        />
        <PostDetailContent
          post={post}
          linkedInData={apiData}
          isFetchingContent={fetchContentMutation.isPending}
          fetchError={fetchContentMutation.isError}
        />
        <PostDetailActions
          post={post}
          shareUrl={apiData?.shareUrl}
          onDelete={() => deleteMutation.mutate({ id: post.id })}
        />
      </div>

      <PostDetailComments comments={apiData?.comments ?? []} />

      <PostDetailNotes
        postId={post.id}
        notes={notes}
        onAddNote={(input) => addNoteMutation.mutate(input)}
        onDeleteNote={(input) => deleteNoteMutation.mutate(input)}
        isAdding={addNoteMutation.isPending}
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
