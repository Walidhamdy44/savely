import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { Platform, SourceType } from "@prisma/client";

// Hash token for comparison
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Extract external ID from LinkedIn URL
function extractLinkedInId(url: string): string {
  // Try to extract activity ID from URL
  const activityMatch = url.match(/activity[:\-](\d+)/);
  if (activityMatch) {
    return `li_${activityMatch[1]}`;
  }
  // Fallback to hash of URL
  return `li_${createHash("md5").update(url).digest("hex").slice(0, 16)}`;
}

// LinkedIn post schema from extension
interface LinkedInPost {
  authorName: string;
  authorProfileURL: string;
  authorJobTitle?: string;
  postURL: string;
  postContent: string;
  postImage?: string;
  timeSincePosted?: string;
  scrapedAt: string;
}

// YouTube video schema from extension
interface YouTubeVideo {
  videoId: string;
  title: string;
  channelName: string;
  channelUrl?: string;
  thumbnailUrl?: string;
  videoUrl: string;
  description?: string;
  scrapedAt: string;
}

// Instagram post schema from extension
interface InstagramPost {
  postURL: string;
  postImage: string;
  postCaption: string;
  scrapedAt: string;
  // Also support Thunderbit format
  "Post Image"?: string;
  "Post URL"?: string;
  "Post Caption"?: string;
}

type SyncPayload =
  | { platform: "linkedin"; posts: LinkedInPost[] }
  | { platform: "youtube"; videos: YouTubeVideo[] }
  | { platform: "instagram"; posts: InstagramPost[] };

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 },
      );
    }

    const rawToken = authHeader.slice(7);
    const hashedToken = hashToken(rawToken);

    // Find token and validate
    const apiToken = await prisma.apiToken.findUnique({
      where: { token: hashedToken },
      include: { User: true },
    });

    if (!apiToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check expiration
    if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    // Update last used
    await prisma.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsed: new Date() },
    });

    // Parse request body
    const body = (await request.json()) as SyncPayload;
    const userId = apiToken.userId;

    let savedCount = 0;
    let skippedCount = 0;

    if (body.platform === "linkedin") {
      // Process LinkedIn posts
      for (const post of body.posts) {
        const externalId = extractLinkedInId(post.postURL);

        try {
          await prisma.savedPost.upsert({
            where: {
              userId_platform_externalId: {
                userId,
                platform: Platform.linkedin,
                externalId,
              },
            },
            create: {
              userId,
              platform: Platform.linkedin,
              externalId,
              title: post.authorName || "LinkedIn Post",
              description: post.postContent?.slice(0, 2000),
              url: post.postURL,
              thumbnail: post.postImage || null,
              authorName: post.authorName,
              sourceType: SourceType.extension,
              metadata: {
                authorProfileURL: post.authorProfileURL,
                authorJobTitle: post.authorJobTitle,
                timeSincePosted: post.timeSincePosted,
                scrapedAt: post.scrapedAt,
              },
              savedAt: new Date(post.scrapedAt),
            },
            update: {
              title: post.authorName || "LinkedIn Post",
              description: post.postContent?.slice(0, 2000),
              thumbnail: post.postImage || null,
              authorName: post.authorName,
              metadata: {
                authorProfileURL: post.authorProfileURL,
                authorJobTitle: post.authorJobTitle,
                timeSincePosted: post.timeSincePosted,
                scrapedAt: post.scrapedAt,
              },
            },
          });
          savedCount++;
        } catch {
          skippedCount++;
        }
      }
    } else if (body.platform === "youtube") {
      // Process YouTube videos
      for (const video of body.videos) {
        try {
          await prisma.savedPost.upsert({
            where: {
              userId_platform_externalId: {
                userId,
                platform: Platform.youtube,
                externalId: video.videoId,
              },
            },
            create: {
              userId,
              platform: Platform.youtube,
              externalId: video.videoId,
              title: video.title,
              description: video.description?.slice(0, 2000),
              url: video.videoUrl,
              thumbnail: video.thumbnailUrl || null,
              authorName: video.channelName,
              sourceType: SourceType.extension,
              metadata: {
                channelUrl: video.channelUrl,
                scrapedAt: video.scrapedAt,
              },
              savedAt: new Date(video.scrapedAt),
            },
            update: {
              title: video.title,
              description: video.description?.slice(0, 2000),
              thumbnail: video.thumbnailUrl || null,
              authorName: video.channelName,
              metadata: {
                channelUrl: video.channelUrl,
                scrapedAt: video.scrapedAt,
              },
            },
          });
          savedCount++;
        } catch {
          skippedCount++;
        }
      }
    } else if (body.platform === "instagram") {
      // Process Instagram posts
      const errors: string[] = [];
      for (const post of body.posts) {
        // Support both Savely and Thunderbit JSON formats
        const postURL = post.postURL || post["Post URL"] || "";
        const postImage = post.postImage || post["Post Image"] || "";
        const postCaption = post.postCaption || post["Post Caption"] || "";

        // Skip posts with no URL
        if (!postURL) {
          skippedCount++;
          continue;
        }

        // Extract shortcode from URL as external ID
        const shortcodeMatch = postURL.match(/\/(p|reel)\/([^/?]+)/);
        const externalId = shortcodeMatch
          ? `ig_${shortcodeMatch[2]}`
          : `ig_${createHash("md5")
              .update(postURL || postImage)
              .digest("hex")
              .slice(0, 16)}`;

        try {
          // Use raw upsert - if URL already exists for this user, update instead
          const existing = await prisma.savedPost.findFirst({
            where: { userId, url: postURL },
          });

          if (existing) {
            // URL already exists - update it
            await prisma.savedPost.update({
              where: { id: existing.id },
              data: {
                title: postCaption?.slice(0, 100) || "Instagram Post",
                description: postCaption?.slice(0, 2000) || null,
                thumbnail: postImage || null,
                platform: Platform.instagram,
              },
            });
          } else {
            await prisma.savedPost.upsert({
              where: {
                userId_platform_externalId: {
                  userId,
                  platform: Platform.instagram,
                  externalId,
                },
              },
              create: {
                userId,
                platform: Platform.instagram,
                externalId,
                title: postCaption?.slice(0, 100) || "Instagram Post",
                description: postCaption?.slice(0, 2000) || null,
                url: postURL,
                thumbnail: postImage || null,
                sourceType: SourceType.extension,
                metadata: {
                  scrapedAt: post.scrapedAt || new Date().toISOString(),
                },
                savedAt: post.scrapedAt ? new Date(post.scrapedAt) : new Date(),
              },
              update: {
                title: postCaption?.slice(0, 100) || "Instagram Post",
                description: postCaption?.slice(0, 2000) || null,
                thumbnail: postImage || null,
              },
            });
          }
          savedCount++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (errors.length < 3) errors.push(msg);
          skippedCount++;
        }
      }
      if (errors.length > 0) {
        console.error("Instagram sync errors (first 3):", errors);
      }
    } else {
      return NextResponse.json(
        { error: "Invalid platform. Supported: linkedin, youtube, instagram" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      saved: savedCount,
      skipped: skippedCount,
      total: savedCount + skippedCount,
      ...(skippedCount > 0 && errors.length > 0 ? { debugErrors: errors } : {}),
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET endpoint to verify token is valid
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header" },
      { status: 401 },
    );
  }

  const rawToken = authHeader.slice(7);
  const hashedToken = hashToken(rawToken);

  const apiToken = await prisma.apiToken.findUnique({
    where: { token: hashedToken },
    include: { User: { select: { email: true, username: true } } },
  });

  if (!apiToken) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 401 });
  }

  return NextResponse.json({
    valid: true,
    user: apiToken.User.username || apiToken.User.email,
    tokenName: apiToken.name,
  });
}
