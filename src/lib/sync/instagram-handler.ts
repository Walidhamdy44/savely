import { createHash } from "crypto";
import { eq, and } from "drizzle-orm";
import type { DrizzleClient } from "@/db/client";
import type { SyncHandler, SyncResult } from "@/types/sync";
import { savedPosts } from "@/db/schema/saved-posts";
import { instagramSyncPostSchema } from "./schemas";
import { z } from "zod";

/** Zod schema for the full Instagram sync payload */
const instagramPayloadSchema = z.object({
  platform: z.literal("instagram"),
  posts: z.array(instagramSyncPostSchema),
});

/**
 * Extract a stable external ID from an Instagram post URL.
 *
 * Tries to pull the shortcode from `/p/` or `/reel/` paths;
 * falls back to an MD5 hash of the URL or image.
 */
function extractInstagramId(postURL: string, postImage: string): string {
  const shortcodeMatch = postURL.match(/\/(p|reel)\/([^/?]+)/);
  if (shortcodeMatch) {
    return `ig_${shortcodeMatch[2]}`;
  }
  return `ig_${createHash("md5")
    .update(postURL || postImage)
    .digest("hex")
    .slice(0, 16)}`;
}

/**
 * Sync handler for Instagram posts.
 *
 * Parses the incoming payload (supporting both Savely and Thunderbit
 * JSON formats), upserts each post into `savedPosts`, and returns a
 * summary of saved / skipped / error counts.
 */
export const instagramHandler: SyncHandler = {
  platform: "instagram",

  async handle(
    userId: string,
    payload: unknown,
    db: DrizzleClient,
  ): Promise<SyncResult> {
    const parsed = instagramPayloadSchema.parse(payload);
    let saved = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const post of parsed.posts) {
      const postURL = post.postURL || post["Post URL"] || "";
      const postImage = post.postImage || post["Post Image"] || "";
      const postCaption = post.postCaption || post["Post Caption"] || "";

      if (!postURL) {
        skipped++;
        continue;
      }

      const externalId = extractInstagramId(postURL, postImage);

      try {
        const existing = await db.query.savedPosts.findFirst({
          where: and(
            eq(savedPosts.userId, userId),
            eq(savedPosts.url, postURL),
          ),
        });

        if (existing) {
          await db
            .update(savedPosts)
            .set({
              title: postCaption?.slice(0, 100) || "Instagram Post",
              description: postCaption?.slice(0, 2000) || null,
              thumbnail: postImage || null,
              platform: "instagram",
            })
            .where(eq(savedPosts.id, existing.id));
        } else {
          await db
            .insert(savedPosts)
            .values({
              userId,
              platform: "instagram",
              externalId,
              title: postCaption?.slice(0, 100) || "Instagram Post",
              description: postCaption?.slice(0, 2000) || null,
              url: postURL,
              thumbnail: postImage || null,
              sourceType: "extension",
              metadata: {
                scrapedAt: post.scrapedAt || new Date().toISOString(),
              },
              savedAt: post.scrapedAt ? new Date(post.scrapedAt) : new Date(),
            })
            .onConflictDoUpdate({
              target: [
                savedPosts.userId,
                savedPosts.platform,
                savedPosts.externalId,
              ],
              set: {
                title: postCaption?.slice(0, 100) || "Instagram Post",
                description: postCaption?.slice(0, 2000) || null,
                thumbnail: postImage || null,
              },
            });
        }
        saved++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (errors.length < 3) errors.push(msg);
        skipped++;
      }
    }

    if (errors.length > 0) {
      console.error("Instagram sync errors (first 3):", errors);
    }

    return { saved, skipped, errors };
  },
};
