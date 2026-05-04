import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { PostDetailRouter } from "@/components/posts/post-detail-router";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    prefetch(trpc.posts.getById.queryOptions({ id }));
    prefetch(trpc.notes.list.queryOptions({ postId: id }));
  } catch {
    // Client will retry
  }

  return (
    <HydrateClient>
      <ErrorBoundary>
        <PostDetailRouter postId={id} />
      </ErrorBoundary>
    </HydrateClient>
  );
}
