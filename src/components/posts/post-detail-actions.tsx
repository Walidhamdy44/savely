"use client";

import { ExternalLink, Trash2 } from "lucide-react";
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
import { PLATFORM_META } from "@/lib/constants/platforms";
import type { SavedPost } from "@/types/posts";

/** Props for the PostDetailActions component. */
interface PostDetailActionsProps {
  post: SavedPost;
  shareUrl?: string | null;
  onDelete: () => void;
}

/**
 * Action bar for a post detail view with "Open on platform"
 * and "Delete" buttons. Delete uses a confirmation dialog.
 */
export function PostDetailActions({
  post,
  shareUrl,
  onDelete,
}: PostDetailActionsProps) {
  const meta = PLATFORM_META[post.platform];
  const linkUrl = shareUrl || post.url;

  return (
    <div className="flex items-center gap-2 pt-4 border-t border-[rgba(255,255,255,0.04)]">
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-[#a48c7f] transition-colors hover:bg-[#332822] hover:text-[#f2dfd5]"
      >
        <ExternalLink className="h-4 w-4" /> Open on {meta.label}
      </a>
      <div className="ml-auto">
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-[#564338] hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            }
          />
          <AlertDialogContent className="border-[rgba(255,255,255,0.06)] bg-[#281d18]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[#f2dfd5]">
                Remove saved post?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[#a48c7f]">
                This will permanently remove this post. This action cannot be
                undone.
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
