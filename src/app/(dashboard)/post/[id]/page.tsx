import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { PostDetail } from "@/components/post-detail";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    prefetch(trpc.posts.getById.queryOptions({ id }));
  } catch {
    // Client will retry
  }

  return (
    <HydrateClient>
      <PostDetail postId={id} />
    </HydrateClient>
  );
}
