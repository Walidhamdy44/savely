import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import { Platform } from "@prisma/client";

// Reusable Zod schema for platform — mirrors the Prisma enum
const platformSchema = z.nativeEnum(Platform);

// Input schema for creating/upserting a saved post
const savePostInput = z.object({
  platform: platformSchema,
  externalId: z.string().min(1, "externalId is required"),
  title: z.string().min(1, "title is required").max(500),
  description: z.string().max(2000).optional(),
  url: z.string().url("url must be a valid URL"),
  thumbnail: z.string().url("thumbnail must be a valid URL").optional(),
  metadata: z.any().optional(),
});

export const postsRouter = createTRPCRouter({
  // ── getAll ─────────────────────────────────────────────────────────────────
  // Cursor-based paginated list of saved posts for the current user.
  // Optionally filtered by platform.
  getAll: protectedProcedure
    .input(
      z.object({
        platform: platformSchema.optional(),
        search: z.string().max(200).optional(),
        limit: z.number().int().min(1).max(100).default(20),
        cursor: z.string().cuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { platform, search, limit, cursor } = input;

      const searchFilter = search?.trim()
        ? {
            OR: [
              {
                title: {
                  contains: search.trim(),
                  mode: "insensitive" as const,
                },
              },
              {
                description: {
                  contains: search.trim(),
                  mode: "insensitive" as const,
                },
              },
              {
                authorName: {
                  contains: search.trim(),
                  mode: "insensitive" as const,
                },
              },
              {
                url: { contains: search.trim(), mode: "insensitive" as const },
              },
            ],
          }
        : {};

      const posts = await ctx.prisma.savedPost.findMany({
        where: {
          userId: ctx.user.id,
          ...(platform !== undefined ? { platform } : {}),
          ...searchFilter,
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { savedAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (posts.length > limit) {
        const nextItem = posts.pop()!;
        nextCursor = nextItem.id;
      }

      return { posts, nextCursor };
    }),

  // ── getById ────────────────────────────────────────────────────────────────
  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.prisma.savedPost.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });
      if (!post) {
        throw new Error("Post not found");
      }
      return post;
    }),

  // ── save ───────────────────────────────────────────────────────────────────
  // Upsert a saved post. Safe to call multiple times with the same externalId.
  save: protectedProcedure
    .input(savePostInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.savedPost.upsert({
        where: {
          userId_platform_externalId: {
            userId: ctx.user.id,
            platform: input.platform,
            externalId: input.externalId,
          },
        },
        create: {
          userId: ctx.user.id,
          platform: input.platform,
          externalId: input.externalId,
          title: input.title,
          description: input.description,
          url: input.url,
          thumbnail: input.thumbnail,
          metadata: input.metadata,
          savedAt: new Date(),
        },
        update: {
          title: input.title,
          description: input.description,
          url: input.url,
          thumbnail: input.thumbnail,
          metadata: input.metadata,
          updatedAt: new Date(),
        },
      });
    }),

  // ── delete ─────────────────────────────────────────────────────────────────
  // Delete a post by ID. The userId check prevents deleting other users' posts.
  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.prisma.savedPost.deleteMany({
        where: { id: input.id, userId: ctx.user.id },
      });
      if (deleted.count === 0) {
        throw new Error("Post not found or already deleted");
      }
      return { success: true };
    }),

  // ── deleteByExternalId ─────────────────────────────────────────────────────
  deleteByExternalId: protectedProcedure
    .input(
      z.object({
        platform: platformSchema,
        externalId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.savedPost.deleteMany({
        where: {
          userId: ctx.user.id,
          platform: input.platform,
          externalId: input.externalId,
        },
      });
      return { success: true };
    }),

  // ── fetchLinkedInContent ──────────────────────────────────────────────────
  // Fetch full LinkedIn post content via ScrapingDog API
  fetchLinkedInContent: protectedProcedure
    .input(z.object({ postId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.savedPost.findFirst({
        where: { id: input.postId, userId: ctx.user.id, platform: "linkedin" },
      });
      if (!post) throw new Error("Post not found");

      // Extract the activity ID from the URL
      const activityMatch = post.url.match(/activity[:\-](\d+)/);
      if (!activityMatch) {
        throw new Error("Could not extract LinkedIn activity ID from URL");
      }

      const linkedInPostId = activityMatch[1];
      const apiKey = process.env.SCRAPINGDOG_API_KEY;
      if (!apiKey) throw new Error("ScrapingDog API key not configured");

      // ScrapingDog expects just the numeric activity ID
      const url = new URL("https://api.scrapingdog.com/profile/post");
      url.searchParams.set("api_key", apiKey);
      url.searchParams.set("id", linkedInPostId);
      url.searchParams.set("type", "profile");

      console.log("=== ScrapingDog Request ===");
      console.log("Activity ID:", linkedInPostId);
      console.log("API URL:", url.toString());

      const res = await fetch(url.toString());
      if (!res.ok) {
        const errorBody = await res.text().catch(() => "");
        console.error("=== ScrapingDog Error ===");
        console.error("Status:", res.status);
        console.error("Body:", errorBody);
        throw new Error(`ScrapingDog API error: ${res.status} - ${errorBody}`);
      }

      const data = await res.json();

      console.log("=== ScrapingDog Response ===");
      console.log(JSON.stringify(data, null, 2));

      // Extract from post_results
      const pr = data?.post_results || data;

      const content = pr?.text || null;
      const authorName = pr?.author?.name || null;
      const authorTitle = pr?.author?.headline || null;
      const authorImage = pr?.author?.image || null;
      const authorUrl = pr?.author?.url || null;
      const authorFollowers = pr?.author?.follower_count || 0;
      const commentCount = pr?.comment_count || 0;
      const comments = (pr?.comments || []).map(
        (c: {
          text: string;
          name: string;
          date: string;
          headline: string;
          profile_link: string;
          total_interactions: number;
        }) => ({
          text: c.text,
          name: c.name,
          date: c.date,
          headline: c.headline,
          profileLink: c.profile_link,
          interactions: c.total_interactions,
        }),
      );
      const activityDate = pr?.activity_date || null;
      const shareUrl = pr?.share_url || null;

      // Update DB
      if (content) {
        await ctx.prisma.savedPost.update({
          where: { id: post.id },
          data: {
            description: content.slice(0, 2000),
            ...(authorName ? { authorName } : {}),
            ...(authorImage ? { thumbnail: authorImage } : {}),
            metadata: {
              ...((post.metadata as Record<string, unknown>) || {}),
              authorJobTitle:
                authorTitle ||
                (post.metadata as Record<string, string>)?.authorJobTitle,
              authorUrl,
              authorFollowers,
              fetchedAt: new Date().toISOString(),
              commentCount,
              activityDate,
              shareUrl,
            },
          },
        });
      }

      return {
        content,
        authorName,
        authorTitle,
        authorImage,
        authorUrl,
        authorFollowers,
        commentCount,
        comments,
        activityDate,
        shareUrl,
      };
    }),

  // ── addNote ──────────────────────────────────────────────────────────────
  addNote: protectedProcedure
    .input(
      z.object({
        postId: z.string().cuid(),
        content: z.string().min(1).max(5000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify post belongs to user
      const post = await ctx.prisma.savedPost.findFirst({
        where: { id: input.postId, userId: ctx.user.id },
      });
      if (!post) throw new Error("Post not found");

      return ctx.prisma.postNote.create({
        data: {
          postId: input.postId,
          userId: ctx.user.id,
          content: input.content,
        },
      });
    }),

  // ── deleteNote ─────────────────────────────────────────────────────────────
  deleteNote: protectedProcedure
    .input(z.object({ noteId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.prisma.postNote.deleteMany({
        where: { id: input.noteId, userId: ctx.user.id },
      });
      if (deleted.count === 0) throw new Error("Note not found");
      return { success: true };
    }),

  // ── getNotes ───────────────────────────────────────────────────────────────
  getNotes: protectedProcedure
    .input(z.object({ postId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.postNote.findMany({
        where: { postId: input.postId, userId: ctx.user.id },
        orderBy: { createdAt: "desc" },
      });
    }),

  // ── counts ─────────────────────────────────────────────────────────────────
  // Summary count per platform — used by the sidebar / stats panel.
  counts: protectedProcedure.query(async ({ ctx }) => {
    const results = await ctx.prisma.savedPost.groupBy({
      by: ["platform"],
      where: { userId: ctx.user.id },
      _count: { id: true },
    });
    return results.map((r) => ({
      platform: r.platform,
      count: r._count.id,
    }));
  }),
});
