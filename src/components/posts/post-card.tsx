"use client";

import { useRouter } from "next/navigation";
import { usePostsMutation } from "@/hooks/use-posts-mutation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Trash2 } from "lucide-react";
import { PLATFORM_META } from "@/lib/constants/platforms";
import type { SavedPost } from "@/types/posts";
import { cn } from "@/lib/utils";

/** Props for the PostCard component. */
type PostCardProps = {
  /** The saved post to display. */
  post: SavedPost;
};

/**
 * Displays a single saved post as a card with thumbnail, title,
 * description, and action buttons. Uses `usePostsMutation` for delete.
 */
export function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const { delete: deleteMutation } = usePostsMutation();
  const meta = PLATFORM_META[post.platform];

  return (
    <div
      onClick={() => router.push(`/post/${post.id}`)}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl bg-[#281d18] border border-[rgba(255,255,255,0.04)] transition-all duration-200 hover:bg-[#332822] hover:shadow-xl hover:shadow-black/20"
    >
      <CardThumbnail post={post} meta={meta} />
      <CardContent post={post} />
      <CardFooter
        post={post}
        onDelete={() => {
          deleteMutation.mutate(
            { id: post.id },
            {
              onSuccess: () => toast.success("Post removed"),
            },
          );
        }}
      />
    </div>
  );
}

/** Thumbnail section with platform badge overlay. */
function CardThumbnail({
  post,
  meta,
}: {
  post: SavedPost;
  meta: (typeof PLATFORM_META)[keyof typeof PLATFORM_META];
}) {
  return (
    <div className="relative m-4 mb-0 overflow-hidden rounded-2xl bg-[#1b110c]">
      <div className="aspect-video w-full">
        {post.thumbnail ? (
          <img
            src={post.thumbnail}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-[#564338]">
            No preview
          </div>
        )}
      </div>
      <div className="absolute left-3 top-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm",
            meta.color,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotColor)} />
          {meta.label}
        </span>
      </div>
    </div>
  );
}

/** Title and description section. */
function CardContent({ post }: { post: SavedPost }) {
  if (post.platform === "linkedin") {
    return (
      <div className="flex flex-1 flex-col px-5 pt-4">
        <h3 className="text-sm font-semibold text-[#f2dfd5]">
          {post.authorName || post.title}
        </h3>
        {(post.description ||
          (post.metadata as Record<string, string>)?.authorJobTitle) && (
          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[#ddc1b3]">
            {post.description ||
              (post.metadata as Record<string, string>)?.authorJobTitle}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-5 pt-4">
      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[#f2dfd5]">
        {post.title}
      </h3>
      {post.description && (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#a48c7f]">
          {post.description}
        </p>
      )}
    </div>
  );
}

/** Date and action buttons footer. */
function CardFooter({
  post,
  onDelete,
}: {
  post: SavedPost;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-5 pb-5 pt-4 mt-auto">
      <span className="text-xs text-[#564338]">
        {new Date(post.savedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </span>

      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#a48c7f] transition-colors hover:bg-white/5 hover:text-[#f2dfd5]"
          aria-label="Open link"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[#a48c7f] hover:bg-red-500/10 hover:text-red-400"
                aria-label="Remove post"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            }
          />
          <AlertDialogContent className="border-[rgba(255,255,255,0.06)] bg-[#281d18]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[#f2dfd5]">
                Remove saved post?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[#a48c7f]">
                This will permanently remove &quot;{post.title}&quot; from your
                saved posts. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-[rgba(255,255,255,0.06)] bg-transparent text-[#a48c7f] hover:bg-[#332822] hover:text-[#f2dfd5]">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-red-500/10 text-red-400 hover:bg-red-500/20"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
