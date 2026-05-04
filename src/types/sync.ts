import type { DrizzleClient } from "@/db/client";

/** Union of supported sync payloads from the browser extension */
export type SyncPayload =
  | { platform: "linkedin"; posts: LinkedInSyncPost[] }
  | { platform: "youtube"; videos: YouTubeSyncVideo[] }
  | { platform: "instagram"; posts: InstagramSyncPost[] };

/** A LinkedIn post as sent by the browser extension */
export interface LinkedInSyncPost {
  /** Author display name */
  authorName: string;
  /** URL to the author's LinkedIn profile */
  authorProfileURL: string;
  /** Author's job title */
  authorJobTitle?: string;
  /** URL to the LinkedIn post */
  postURL: string;
  /** Post text content */
  postContent: string;
  /** Post image URL */
  postImage?: string;
  /** Relative time since posted (e.g. "2h") */
  timeSincePosted?: string;
  /** ISO timestamp when the post was scraped */
  scrapedAt: string;
}

/** A YouTube video as sent by the browser extension */
export interface YouTubeSyncVideo {
  /** YouTube video ID */
  videoId: string;
  /** Video title */
  title: string;
  /** Channel name */
  channelName: string;
  /** URL to the channel */
  channelUrl?: string;
  /** Thumbnail image URL */
  thumbnailUrl?: string;
  /** Full video URL */
  videoUrl: string;
  /** Video description */
  description?: string;
  /** ISO timestamp when the video was scraped */
  scrapedAt: string;
}

/** An Instagram post as sent by the browser extension */
export interface InstagramSyncPost {
  /** URL to the Instagram post */
  postURL: string;
  /** Post image URL */
  postImage: string;
  /** Post caption text */
  postCaption: string;
  /** ISO timestamp when the post was scraped */
  scrapedAt: string;
  /** Thunderbit format: post image */
  "Post Image"?: string;
  /** Thunderbit format: post URL */
  "Post URL"?: string;
  /** Thunderbit format: post caption */
  "Post Caption"?: string;
}

/** Result returned by a platform sync handler */
export interface SyncResult {
  /** Number of posts successfully saved */
  saved: number;
  /** Number of posts skipped (duplicates or failures) */
  skipped: number;
  /** Error messages for failed items */
  errors: string[];
}

/** Interface for platform-specific sync handlers */
export interface SyncHandler {
  /** Platform identifier (e.g. "linkedin", "youtube", "instagram") */
  platform: string;
  /** Process a sync payload and persist posts to the database */
  handle(
    userId: string,
    payload: unknown,
    db: DrizzleClient,
  ): Promise<SyncResult>;
}

/** Response shape returned by the sync API endpoint */
export interface SyncResponse {
  /** Whether the sync completed without fatal errors */
  success: boolean;
  /** Number of posts saved */
  saved: number;
  /** Number of posts skipped */
  skipped: number;
  /** Total posts processed */
  total: number;
  /** Debug error messages (included when there are skipped items with errors) */
  debugErrors?: string[];
}
