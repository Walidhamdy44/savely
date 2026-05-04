"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { DetailSkeleton } from "@/components/ui/loading-skeleton";
import type { Platform } from "@/lib/constants/platforms";
import type { PlatformViewProps } from "./types";
import { LinkedInPostDetail } from "./views/linkedin-post-detail";
import { InstagramReelDetail } from "./views/instagram-reel-detail";
import { YouTubeVideoDetail } from "./views/youtube-video-detail";
import { GenericPostDetail } from "./views/generic-post-detail";

/** Props for the PostDetailRouter composition root. */
type PostDetailRouterProps = { postId: string };

/** The shape of a platform-specific view component. */
type PlatformViewComponent = React.ComponentType<PlatformViewProps>;

/**
 * Pure function that maps a platform value to the correct view component.
 * Exported for testability.
 */
export function getPlatformView(platform: Platform): PlatformViewComponent {
  switch (platform) {
    case "linkedin":
      return LinkedInPostDetail;
    case "instagram":
      return InstagramReelDetail;
    case "youtube":
      return YouTubeVideoDetail;
    default:
      return GenericPostDetail;
  }
}

/**
 * Composition root for the post detail view.
 * Fetches post + notes, sets up mutations, and delegates rendering
 * to the correct platform-specific view component.
 */
export function PostDetailRouter({ postId }: PostDetailRouterProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: post, isLoading } = useQuery(
    trpc.posts.getById.queryOptions({ id: postId }),
  );

  const { data: notes = [] } = useQuery(
    trpc.notes.list.queryOptions({ postId }),
  );

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

  const PlatformView = getPlatformView(post.platform);

  return (
    <PlatformView
      post={post}
      notes={notes}
      onDelete={() => deleteMutation.mutate({ id: post.id })}
      onAddNote={(input) => addNoteMutation.mutate(input)}
      onDeleteNote={(input) => deleteNoteMutation.mutate(input)}
      isAddingNote={addNoteMutation.isPending}
    />
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
