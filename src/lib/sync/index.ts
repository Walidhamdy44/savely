import type { SyncHandler } from "@/types/sync";
import { linkedInHandler } from "./linkedin-handler";
import { youtubeHandler } from "./youtube-handler";
import { instagramHandler } from "./instagram-handler";

/** Registry mapping platform strings to their sync handlers */
const handlerRegistry = new Map<string, SyncHandler>([
  [linkedInHandler.platform, linkedInHandler],
  [youtubeHandler.platform, youtubeHandler],
  [instagramHandler.platform, instagramHandler],
]);

/**
 * Look up the sync handler for a given platform.
 *
 * @param platform - Platform identifier (e.g. "linkedin", "youtube", "instagram")
 * @returns The matching SyncHandler, or undefined if the platform is not supported
 */
export function getHandler(platform: string): SyncHandler | undefined {
  return handlerRegistry.get(platform);
}

export { linkedInHandler } from "./linkedin-handler";
export { youtubeHandler } from "./youtube-handler";
export { instagramHandler } from "./instagram-handler";
