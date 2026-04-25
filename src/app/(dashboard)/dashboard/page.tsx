import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { PostsGrid } from "@/components/posts-grid";
import { AddPostDialog } from "@/components/add-post-dialog";

export default async function DashboardPage() {
  // Prefetch may fail if user record hasn't been created by webhook yet
  try {
    prefetch(trpc.posts.getAll.queryOptions({ limit: 20 }));
    prefetch(trpc.posts.counts.queryOptions());
  } catch {
    // Client will retry — this is fine
  }

  return (
    <HydrateClient>
      <div className="space-y-8">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-[#f2dfd5]">
              Saved Posts
            </h1>
            <p className="text-sm text-[#a48c7f]">
              Your saved content from YouTube, LinkedIn, GitHub, and manual
              links.
            </p>
          </div>
          <AddPostDialog />
        </div>

        {/* Posts grid with infinite scroll */}
        <PostsGrid />
      </div>
    </HydrateClient>
  );
}
