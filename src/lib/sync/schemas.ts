import { z } from "zod";

/**
 * Zod schema for a single LinkedIn post from the browser extension.
 *
 * Validates the shape of a LinkedIn post as scraped by the Savely extension.
 */
export const linkedInSyncPostSchema = z.object({
  /** Author display name */
  authorName: z.string(),
  /** URL to the author's LinkedIn profile */
  authorProfileURL: z.string(),
  /** Author's job title */
  authorJobTitle: z.string().optional(),
  /** URL to the LinkedIn post */
  postURL: z.string(),
  /** Post text content */
  postContent: z.string(),
  /** Post image URL */
  postImage: z.string().optional(),
  /** Relative time since posted (e.g. "2h") */
  timeSincePosted: z.string().optional(),
  /** ISO timestamp when the post was scraped */
  scrapedAt: z.string(),
});

/**
 * Zod schema for a single YouTube video from the browser extension.
 *
 * Validates the shape of a YouTube video as scraped by the Savely extension.
 */
export const youtubeSyncVideoSchema = z.object({
  /** YouTube video ID */
  videoId: z.string(),
  /** Video title */
  title: z.string(),
  /** Channel name */
  channelName: z.string(),
  /** URL to the channel */
  channelUrl: z.string().optional(),
  /** Thumbnail image URL */
  thumbnailUrl: z.string().optional(),
  /** Full video URL */
  videoUrl: z.string(),
  /** Video description */
  description: z.string().optional(),
  /** ISO timestamp when the video was scraped */
  scrapedAt: z.string(),
});

/**
 * Zod schema for a single Instagram post from the browser extension.
 *
 * Validates the shape of an Instagram post as scraped by the Savely extension.
 * Supports both the Savely format and the Thunderbit JSON format.
 */
export const instagramSyncPostSchema = z.object({
  /** URL to the Instagram post */
  postURL: z.string(),
  /** Post image URL */
  postImage: z.string(),
  /** Post caption text */
  postCaption: z.string(),
  /** ISO timestamp when the post was scraped */
  scrapedAt: z.string(),
  /** Thunderbit format: post image */
  "Post Image": z.string().optional(),
  /** Thunderbit format: post URL */
  "Post URL": z.string().optional(),
  /** Thunderbit format: post caption */
  "Post Caption": z.string().optional(),
});

/**
 * Zod schema for the full sync request payload.
 *
 * Uses a discriminated union on the `platform` field to determine which
 * sub-schema to apply. LinkedIn and Instagram payloads use a `posts` array,
 * while YouTube payloads use a `videos` array.
 */
export const syncPayloadSchema = z.discriminatedUnion("platform", [
  z.object({
    platform: z.literal("linkedin"),
    posts: z.array(linkedInSyncPostSchema),
  }),
  z.object({
    platform: z.literal("youtube"),
    videos: z.array(youtubeSyncVideoSchema),
  }),
  z.object({
    platform: z.literal("instagram"),
    posts: z.array(instagramSyncPostSchema),
  }),
]);
