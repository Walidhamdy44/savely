import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { PostsGrid } from "@/components/posts-grid";
import { AddPostDialog } from "@/components/add-post-dialog";

export default async function DashboardPage() {
  // Prefetch on the server so the client renders without a loading flash
  prefetch(trpc.posts.getAll.queryOptions({ limit: 20 }));
  prefetch(trpc.posts.counts.queryOptions());

  return (
    <HydrateClient>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Saved posts</h1>
            <p className="text-sm text-muted-foreground">
              Your saved content from YouTube, GitHub, and manual links.
            </p>
          </div>
          <AddPostDialog />
        </div>

        {/* Posts grid with platform filter */}
        <PostsGrid />
      </div>
    </HydrateClient>
  );
}
