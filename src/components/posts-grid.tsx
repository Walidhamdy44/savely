"use client";

import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Platform } from "@prisma/client";
import { PostCard } from "@/components/post-card";
import { PlatformFilter } from "@/components/platform-filter";
import { Skeleton } from "@/components/ui/skeleton";
import { BookmarkX } from "lucide-react";

export function PostsGrid() {
  const trpc = useTRPC();
  const [platform, setPlatform] = useState<Platform | undefined>(undefined);

  const { data: postsData, isLoading: postsLoading } = useQuery(
    trpc.posts.getAll.queryOptions({ platform, limit: 20 }),
  );

  const { data: countsData } = useQuery(trpc.posts.counts.queryOptions());

  const posts = postsData?.posts ?? [];

  return (
    <div className="space-y-6">
      {/* Platform filter bar */}
      <PlatformFilter
        selected={platform}
        onSelect={setPlatform}
        counts={countsData}
      />

      {/* Loading skeletons */}
      {postsLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col overflow-hidden rounded-xl border"
            >
              <Skeleton className="h-40 w-full rounded-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!postsLoading && posts.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20 text-center">
          <BookmarkX className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">
            No saved posts yet
          </p>
          <p className="max-w-xs text-sm text-muted-foreground/70">
            {platform
              ? `You have no saved posts from ${platform}.`
              : "Start saving content from YouTube or GitHub to see it here."}
          </p>
        </div>
      )}

      {/* Post cards */}
      {!postsLoading && posts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Load more indicator */}
      {postsData?.nextCursor && (
        <p className="text-center text-sm text-muted-foreground">
          Scroll for more — pagination coming soon.
        </p>
      )}
    </div>
  );
}
