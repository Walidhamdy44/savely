import { createHash } from "crypto";
import type { DrizzleClient } from "@/db/client";
import type { SyncHandler, SyncResult } from "@/types/sync";
import { savedPosts } from "@/db/schema/saved-posts";
import { linkedInSyncPostSchema } from "./schemas";
import { z } from "zod";

/**
 * Extract a stable external ID from a LinkedIn post URL.
 *
 * Tries to pull the activity ID from the URL; falls back to an MD5 hash
 * of the URL when no activity ID is present.
 */
function extractLinkedInId(url: string): string {
  const activityMatch = url.match(/activity[:\-](\d+)/);
  if (activityMatch) {
    return `li_${activityMatch[1]}`;
  }
  return `li_${createHash("md5").update(url).digest("hex").slice(0, 16)}`;
}

/** Zod schema for the full LinkedIn sync payload */
const linkedInPayloadSchema = z.object({
  platform: z.literal("linkedin"),
  posts: z.array(linkedInSyncPostSchema),
});

/**
 * Sync handler for LinkedIn posts.
 *
 * Parses the incoming payload, upserts each post into `savedPosts`
 * using the composite unique index (userId, platform, externalId),
 * and returns a summary of saved / skipped / error counts.
 */
export const linkedInHandler: SyncHandler = {
  platform: "linkedin",

  async handle(
    userId: string,
    payload: unknown,
    db: DrizzleClient,
  ): Promise<SyncResult> {
    const parsed = linkedInPayloadSchema.parse(payload);
    let saved = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const post of parsed.posts) {
      const externalId = extractLinkedInId(post.postURL);

      try {
        await db
          .insert(savedPosts)
          .values({
            userId,
            platform: "linkedin",
            externalId,
            title: post.authorName || "LinkedIn Post",
            description: (post.postContent || post.authorJobTitle)?.slice(
              0,
              2000,
            ),
            url: post.postURL,
            thumbnail: post.postImage ?? null,
            authorName: post.authorName,
            sourceType: "extension",
            metadata: {
              authorProfileURL: post.authorProfileURL,
              authorJobTitle: post.authorJobTitle,
              timeSincePosted: post.timeSincePosted,
              scrapedAt: post.scrapedAt,
            },
            savedAt: new Date(post.scrapedAt),
          })
          .onConflictDoUpdate({
            target: [
              savedPosts.userId,
              savedPosts.platform,
              savedPosts.externalId,
            ],
            set: {
              title: post.authorName || "LinkedIn Post",
              description: (post.postContent || post.authorJobTitle)?.slice(
                0,
                2000,
              ),
              thumbnail: post.postImage ?? null,
              authorName: post.authorName,
              metadata: {
                authorProfileURL: post.authorProfileURL,
                authorJobTitle: post.authorJobTitle,
                timeSincePosted: post.timeSincePosted,
                scrapedAt: post.scrapedAt,
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
