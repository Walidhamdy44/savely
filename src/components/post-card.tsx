"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <Card className="group flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      {/* Thumbnail */}
      {post.thumbnail ? (
        <div className="relative h-40 w-full overflow-hidden bg-muted">
          <img
            src={post.thumbnail}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-muted text-muted-foreground text-sm">
          No preview
        </div>
      )}

      {/* Header */}
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="line-clamp-2 text-sm font-medium leading-snug">
          {post.title}
        </CardTitle>
        {post.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {post.description}
          </p>
        )}
      </CardHeader>

      {/* Footer */}
      <CardFooter className="mt-auto flex items-center justify-between gap-2 pt-0">
        <Badge
          variant="secondary"
          className={cn("text-xs capitalize", meta.color)}
        >
          {meta.label}
        </Badge>

        <div className="flex items-center gap-1">
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Open link"
          >
            <ExternalLink className="h-4 w-4" />
          </a>

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  aria-label="Remove post"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove saved post?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove &quot;{post.title}&quot; from
                  your saved posts. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate({ id: post.id })}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}
