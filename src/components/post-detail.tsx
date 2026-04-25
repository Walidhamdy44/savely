"use client";

import { useState, useEffect } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
import {
  ArrowLeft,
  ExternalLink,
  Trash2,
  PenLine,
  Save,
  Loader2,
  MessageCircle,
  Users,
  Calendar,
} from "lucide-react";
import { PLATFORM_META } from "@/lib/platforms";
import { cn } from "@/lib/utils";

type Props = { postId: string };

function timeAgo(date: Date | string): string {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function PostDetail({ postId }: Props) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState("");

  const { data: post, isLoading } = useQuery(
    trpc.posts.getById.queryOptions({ id: postId }),
  );

  const { data: notes } = useQuery({
    ...trpc.posts.getNotes.queryOptions({ postId }),
  }) as {
    data: Array<{ id: string; content: string; createdAt: Date }> | undefined;
  };

  const fetchContentMutation = useMutation(
    trpc.posts.fetchLinkedInContent.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.posts.getById.queryKey({ id: postId }),
        });
      },
    }),
  );

  const [hasFetched, setHasFetched] = useState(false);
  useEffect(() => {
    if (
      post &&
      post.platform === "linkedin" &&
      !hasFetched &&
      !fetchContentMutation.isPending
    ) {
      setHasFetched(true);
      fetchContentMutation.mutate({ postId: post.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id]);

  const deleteMutation = useMutation(
    trpc.posts.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Post removed");
        queryClient.invalidateQueries({ queryKey: [["posts"]] });
        router.push("/dashboard");
      },
      onError: () => toast.error("Failed to remove post"),
    }),
  );

  const addNoteMutation = useMutation(
    trpc.posts.addNote.mutationOptions({
      onSuccess: () => {
        toast.success("Note added");
        setNoteText("");
        queryClient.invalidateQueries({
          queryKey: trpc.posts.getNotes.queryKey({ postId }),
        });
      },
      onError: () => toast.error("Failed to add note"),
    }),
  );

  const deleteNoteMutation = useMutation(
    trpc.posts.deleteNote.mutationOptions({
      onSuccess: () => {
        toast.success("Note deleted");
        queryClient.invalidateQueries({
          queryKey: trpc.posts.getNotes.queryKey({ postId }),
        });
      },
      onError: () => toast.error("Failed to delete note"),
    }),
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-5 w-32 animate-pulse rounded-lg bg-[#332822]" />
        <div className="rounded-3xl bg-[#281d18] p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 animate-pulse rounded-full bg-[#332822]" />
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded-lg bg-[#332822]" />
              <div className="h-3 w-48 animate-pulse rounded-lg bg-[#332822]" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 w-full animate-pulse rounded-lg bg-[#332822]" />
            <div className="h-4 w-3/4 animate-pulse rounded-lg bg-[#332822]" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-sm text-[#a48c7f] hover:text-[#f2dfd5] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to posts
        </button>
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-[#281d18] py-20 text-center">
          <p className="text-lg font-semibold text-[#a48c7f]">Post not found</p>
        </div>
      </div>
    );
  }

  const meta = PLATFORM_META[post.platform];
  const metadata = post.metadata as Record<string, string> | null;
  const apiData = fetchContentMutation.data;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 text-sm text-[#a48c7f] hover:text-[#f2dfd5] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to posts
      </button>

      {/* Main post card */}
      <div className="rounded-3xl bg-[#281d18] p-8">
        {/* Author info */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            {apiData?.authorImage || post.thumbnail ? (
              <img
                src={apiData?.authorImage || post.thumbnail || ""}
                alt={apiData?.authorName || post.authorName || ""}
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#332822] text-lg font-bold text-[#a48c7f]">
                {(post.authorName || post.title)[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#f2dfd5]">
                  {apiData?.authorName || post.authorName || post.title}
                </h2>
                {apiData?.authorUrl && (
                  <a
                    href={apiData.authorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#564338] hover:text-[#FF8C42] transition-colors"
                  >
                    @{apiData.authorUrl.split("/in/")[1]?.replace(/\/$/, "")}
                  </a>
                )}
              </div>
              {(apiData?.authorTitle || metadata?.authorJobTitle) && (
                <p className="text-sm text-[#a48c7f]">
                  {apiData?.authorTitle || metadata?.authorJobTitle}
                </p>
              )}
              {apiData?.authorFollowers ? (
                <div className="mt-1 flex items-center gap-1 text-xs text-[#564338]">
                  <Users className="h-3 w-3" />
                  {apiData.authorFollowers.toLocaleString()} followers
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
            {apiData?.activityDate && (
              <div className="flex items-center gap-1 text-xs text-[#564338]">
                <Calendar className="h-3 w-3" />
                {new Date(apiData.activityDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            )}
          </div>
        </div>

        {/* Post content */}
        <div className="mb-6">
          {post.platform === "linkedin" ? (
            fetchContentMutation.isPending ? (
              <div className="flex items-center gap-3 py-8">
                <Loader2 className="h-5 w-5 animate-spin text-[#FF8C42]" />
                <span className="text-sm text-[#a48c7f]">
                  Fetching post content from LinkedIn…
                </span>
              </div>
            ) : apiData?.content ? (
              <>
                <p className="text-base leading-[1.8] text-[#f2dfd5] whitespace-pre-wrap">
                  {apiData.content}
                </p>

                {/* Post image — show if thumbnail exists and differs from author avatar */}
                {post.thumbnail && post.thumbnail !== apiData?.authorImage && (
                  <div className="mt-5 overflow-hidden rounded-2xl bg-[#1b110c]">
                    <img
                      src={post.thumbnail}
                      alt="Post attachment"
                      className="w-full object-contain max-h-[500px]"
                    />
                  </div>
                )}
              </>
            ) : fetchContentMutation.isError ? (
              <div className="space-y-2">
                <p className="text-base leading-[1.7] text-[#f2dfd5] whitespace-pre-wrap">
                  {post.description || post.title}
                </p>
                <p className="text-xs text-[#564338] mt-2">
                  ⚠ Could not fetch full content from LinkedIn API.
                </p>
              </div>
            ) : (
              <p className="text-base leading-[1.7] text-[#f2dfd5] whitespace-pre-wrap">
                {post.description || post.title}
              </p>
            )
          ) : (
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
          )}
        </div>

        {/* Engagement stats */}
        {apiData && (apiData.commentCount > 0 || apiData.shareUrl) && (
          <div className="mb-6 flex items-center gap-4 text-xs text-[#a48c7f]">
            {apiData.commentCount > 0 && (
              <span className="flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" />
                {apiData.commentCount} comments
              </span>
            )}
            {apiData.shareUrl && (
              <a
                href={apiData.shareUrl}
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

        {post.thumbnail && post.platform !== "linkedin" && (
          <div className="mb-6 overflow-hidden rounded-2xl">
            <img
              src={post.thumbnail}
              alt={post.title}
              className="w-full object-cover"
            />
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-2 pt-4 border-t border-[rgba(255,255,255,0.04)]">
          <a
            href={apiData?.shareUrl || post.url}
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
                    This will permanently remove this post. This action cannot
                    be undone.
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

      {/* Comments section from ScrapingDog */}
      {apiData?.comments && apiData.comments.length > 0 && (
        <div className="rounded-3xl bg-[#281d18] p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
              <MessageCircle className="h-4 w-4 text-sky-400" />
            </div>
            <h3 className="text-base font-semibold text-[#f2dfd5]">
              Comments ({apiData.comments.length})
            </h3>
          </div>

          <div className="space-y-4">
            {apiData.comments.map(
              (
                comment: {
                  name: string;
                  text: string;
                  date: string;
                  headline: string;
                  profileLink: string;
                  interactions: number;
                },
                i: number,
              ) => (
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
              ),
            )}
          </div>
        </div>
      )}

      <div className="rounded-3xl bg-[#281d18] p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF8C42]/10">
            <PenLine className="h-4 w-4 text-[#FF8C42]" />
          </div>
          <h3 className="text-base font-semibold text-[#f2dfd5]">Your Notes</h3>
        </div>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add your reflections or context here..."
          rows={4}
          className="w-full resize-y rounded-2xl bg-[#332822] px-5 py-4 text-sm leading-relaxed text-[#f2dfd5] placeholder:text-[#564338] outline-none transition-all focus:ring-2 focus:ring-[#FF8C42]/20"
        />
        {noteText.trim() && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() =>
                addNoteMutation.mutate({
                  postId: post.id,
                  content: noteText.trim(),
                })
              }
              disabled={addNoteMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-[#FFB68D] px-6 py-2.5 text-sm font-semibold text-[#532200] transition-colors hover:bg-[#FFDBC9] disabled:opacity-50"
            >
              {addNoteMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save Note
            </button>
          </div>
        )}
      </div>

      {/* Saved notes */}
      {notes && notes.length > 0 && (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="rounded-3xl bg-[#231914] p-6">
              <div className="flex gap-4">
                <div className="w-1 shrink-0 rounded-full bg-[#FF8C42]/40" />
                <div className="flex-1 space-y-3">
                  <p className="text-sm italic leading-relaxed text-[#ddc1b3]">
                    &quot;{note.content}&quot;
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-[#564338]">
                      Drafted {timeAgo(note.createdAt)}
                    </span>
                    <button
                      onClick={() =>
                        deleteNoteMutation.mutate({ noteId: note.id })
                      }
                      className="text-xs font-medium text-[#564338] hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Metadata */}
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
