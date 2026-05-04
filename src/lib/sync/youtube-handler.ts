import type { DrizzleClient } from "@/db/client";
import type { SyncHandler, SyncResult } from "@/types/sync";
import { savedPosts } from "@/db/schema/saved-posts";
import { youtubeSyncVideoSchema } from "./schemas";
import { z } from "zod";

/** Zod schema for the full YouTube sync payload */
const youtubePayloadSchema = z.object({
  platform: z.literal("youtube"),
  videos: z.array(youtubeSyncVideoSchema),
});

/**
 * Sync handler for YouTube videos.
 *
 * Parses the incoming payload, upserts each video into `savedPosts`
 * using the composite unique index (userId, platform, externalId),
 * and returns a summary of saved / skipped / error counts.
 */
export const youtubeHandler: SyncHandler = {
  platform: "youtube",

  async handle(
    userId: string,
    payload: unknown,
    db: DrizzleClient,
  ): Promise<SyncResult> {
    const parsed = youtubePayloadSchema.parse(payload);
    let saved = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const video of parsed.videos) {
      try {
        await db
          .insert(savedPosts)
          .values({
            userId,
            platform: "youtube",
            externalId: video.videoId,
            title: video.title,
            description: video.description?.slice(0, 2000),
            url: video.videoUrl,
            thumbnail: video.thumbnailUrl ?? null,
            authorName: video.channelName,
            sourceType: "extension",
            metadata: {
              channelUrl: video.channelUrl,
              scrapedAt: video.scrapedAt,
            },
            savedAt: new Date(video.scrapedAt),
          })
          .onConflictDoUpdate({
            target: [
              savedPosts.userId,
              savedPosts.platform,
              savedPosts.externalId,
            ],
            set: {
              title: video.title,
              description: video.description?.slice(0, 2000),
              thumbnail: video.thumbnailUrl ?? null,
              authorName: video.channelName,
              metadata: {
                channelUrl: video.channelUrl,
                scrapedAt: video.scrapedAt,
              },
            },
          });
        saved++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (errors.length < 3) errors.push(msg);
        skipped++;
      }
    }

    return { saved, skipped, errors };
  },
};
