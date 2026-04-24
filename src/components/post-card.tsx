"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { PLATFORM_META } from "@/lib/platforms";
import type { SavedPost } from "@prisma/client";
import { cn } from "@/lib/utils";

type Props = {
  post: SavedPost;
};

export function PostCard({ post }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const meta = PLATFORM_META[post.platform];

  const deleteMutation = useMutation(
    trpc.posts.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Post removed");
        void queryClient.invalidateQueries({ queryKey: [["posts"]] });
      },
      onError: () => {
        toast.error("Failed to remove post");
      },
    }),
  );

  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl bg-[#281d18] border border-[rgba(255,255,255,0.04)] transition-all duration-200 hover:bg-[#332822] hover:shadow-xl hover:shadow-black/20">
      {/* Thumbnail */}
      {post.thumbnail ? (
        <div className="relative m-4 mb-0 overflow-hidden rounded-2xl bg-[#1b110c]">
          <div className="aspect-video w-full">
            <img
              src={post.thumbnail}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          {/* Platform badge overlay */}
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
      ) : (
        <div className="relative m-4 mb-0 overflow-hidden rounded-2xl bg-[#1b110c]">
          <div className="flex aspect-video w-full items-center justify-center text-sm text-[#564338]">
            No preview
          </div>
          {/* Platform badge overlay */}
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
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col p-5 pt-4">
        {/* LinkedIn: show author name + description as post content */}
        {post.platform === "linkedin" ? (
          <>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#f2dfd5]">
                {post.authorName || post.title}
              </h3>
            </div>
            {/* Show description, or fall back to job title from metadata */}
            {(post.description ||
              (post.metadata as Record<string, string>)?.authorJobTitle) && (
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[#ddc1b3]">
                {post.description ||
                  (post.metadata as Record<string, string>)?.authorJobTitle}
              </p>
            )}
          </>
        ) : (
          <>
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[#f2dfd5]">
              {post.title}
            </h3>
            {post.description && (
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#a48c7f]">
                {post.description}
              </p>
            )}
          </>
        )}

        {/* Actions */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
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
                    This will permanently remove &quot;{post.title}&quot; from
                    your saved posts. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-[rgba(255,255,255,0.06)] bg-transparent text-[#a48c7f] hover:bg-[#332822] hover:text-[#f2dfd5]">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate({ id: post.id })}
                    className="bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
