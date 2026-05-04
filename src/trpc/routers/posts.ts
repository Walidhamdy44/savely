import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, lt, like, or, sql, count } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../init";
import { savedPosts } from "@/db/schema/saved-posts";
import { platformEnum } from "@/db/schema/enums";
import { getPostById, countPostsByPlatform } from "@/db/prepared";
import {
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from "@/lib/constants/validation";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants/pagination";
import { SCRAPINGDOG_API_BASE } from "@/lib/constants/api";

/** Zod schema for the platform enum — mirrors the Drizzle pgEnum values */
const platformSchema = z.enum(platformEnum.enumValues);

/** Input schema for creating/upserting a saved post */
const savePostInput = z.object({
  platform: platformSchema,
  externalId: z.string().min(1, "externalId is required"),
  title: z.string().min(1, "title is required").max(MAX_TITLE_LENGTH),
  description: z.string().max(MAX_DESCRIPTION_LENGTH).optional(),
  url: z.string().url("url must be a valid URL"),
  thumbnail: z.string().url("thumbnail must be a valid URL").optional(),
  metadata: z.any().optional(),
});

export const postsRouter = createTRPCRouter({
  /**
   * Cursor-based paginated list of saved posts for the current user.
   * Optionally filtered by platform and/or search text.
   */
  getAll: protectedProcedure
    .input(
      z.object({
        platform: platformSchema.optional(),
        search: z.string().max(200).optional(),
        limit: z
          .number()
          .int()
          .min(1)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { platform, search, limit, cursor } = input;
      const userId = ctx.user.id;
      const trimmedSearch = search?.trim();

      const conditions = [eq(savedPosts.userId, userId)];

      if (platform) {
        conditions.push(eq(savedPosts.platform, platform));
      }

      if (trimmedSearch) {
        const pattern = `%${trimmedSearch}%`;
        conditions.push(
          or(
            like(savedPosts.title, pattern),
            like(savedPosts.description, pattern),
            like(savedPosts.authorName, pattern),
            like(savedPosts.url, pattern),
          )!,
        );
      }

      if (cursor) {
        // For cursor pagination: fetch the cursor post's savedAt, then filter lt
        const cursorPost = await ctx.db
          .select({ savedAt: savedPosts.savedAt })
          .from(savedPosts)
          .where(and(eq(savedPosts.id, cursor), eq(savedPosts.userId, userId)))
          .limit(1);

        if (cursorPost.length > 0) {
          conditions.push(lt(savedPosts.savedAt, cursorPost[0].savedAt));
        }
      }

      const posts = await ctx.db
        .select()
        .from(savedPosts)
        .where(and(...conditions))
        .orderBy(desc(savedPosts.savedAt))
        .limit(limit + 1);

      let nextCursor: string | undefined;
      if (posts.length > limit) {
        const nextItem = posts.pop()!;
        nextCursor = nextItem.id;
      }

      return { posts, nextCursor };
    }),

  /** Get a single post by ID (uses prepared statement). */
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const results = await getPostById.execute({
        id: input.id,
        userId: ctx.user.id,
      });

      if (results.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      return results[0];
    }),

  /** Upsert a saved post. Safe to call multiple times with the same externalId. */
  save: protectedProcedure
    .input(savePostInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check if post already exists for this user+platform+externalId
      const existing = await ctx.db
        .select({ id: savedPosts.id })
        .from(savedPosts)
        .where(
          and(
            eq(savedPosts.userId, userId),
            eq(savedPosts.platform, input.platform),
            eq(savedPosts.externalId, input.externalId),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing post
        const updated = await ctx.db
          .update(savedPosts)
          .set({
            title: input.title,
            description: input.description,
            url: input.url,
            thumbnail: input.thumbnail,
            metadata: input.metadata,
            updatedAt: new Date(),
          })
          .where(eq(savedPosts.id, existing[0].id))
          .returning();

        return updated[0];
      }

      // Insert new post
      const inserted = await ctx.db
        .insert(savedPosts)
        .values({
          userId,
          platform: input.platform,
          externalId: input.externalId,
          title: input.title,
          description: input.description,
          url: input.url,
          thumbnail: input.thumbnail,
          metadata: input.metadata,
          savedAt: new Date(),
        })
        .returning();

      return inserted[0];
    }),

  /** Delete a post by ID. The userId check prevents deleting other users' posts. */
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(savedPosts)
        .where(
          and(eq(savedPosts.id, input.id), eq(savedPosts.userId, ctx.user.id)),
        )
        .returning({ id: savedPosts.id });

      if (deleted.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found or already deleted",
        });
      }

      return { success: true };
    }),

  /** Delete a post by platform + externalId. */
  deleteByExternalId: protectedProcedure
    .input(
      z.object({
        platform: platformSchema,
        externalId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(savedPosts)
        .where(
          and(
            eq(savedPosts.userId, ctx.user.id),
            eq(savedPosts.platform, input.platform),
            eq(savedPosts.externalId, input.externalId),
          ),
        );

      return { success: true };
    }),

  /** Summary count per platform (uses prepared statement). */
  counts: protectedProcedure.query(async ({ ctx }) => {
    const results = await countPostsByPlatform.execute({
      userId: ctx.user.id,
    });

    return results.map((r) => ({
      platform: r.platform,
      count: Number(r.count),
    }));
  }),

  /** Fetch full LinkedIn post content via ScrapingDog API. */
  fetchLinkedInContent: protectedProcedure
    .input(z.object({ postId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db
        .select()
        .from(savedPosts)
        .where(
          and(
            eq(savedPosts.id, input.postId),
            eq(savedPosts.userId, ctx.user.id),
            eq(savedPosts.platform, "linkedin"),
          ),
        )
        .limit(1);

      if (post.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      const linkedInPost = post[0];

      const activityMatch = linkedInPost.url.match(/activity[:\-](\d+)/);
      if (!activityMatch) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not extract LinkedIn activity ID from URL",
        });
      }

      const linkedInPostId = activityMatch[1];
      const apiKey = process.env.SCRAPINGDOG_API_KEY;
      if (!apiKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "ScrapingDog API key not configured",
        });
      }

      const url = new URL(`${SCRAPINGDOG_API_BASE}/profile/post`);
      url.searchParams.set("api_key", apiKey);
      url.searchParams.set("id", linkedInPostId);
      url.searchParams.set("type", "profile");

      const res = await fetch(url.toString());
      if (!res.ok) {
        const errorBody = await res.text().catch(() => "");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `ScrapingDog API error: ${res.status} - ${errorBody}`,
        });
      }

      const data = await res.json();
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

      if (content) {
        await ctx.db
          .update(savedPosts)
          .set({
            description: content.slice(0, MAX_DESCRIPTION_LENGTH),
            ...(authorName ? { authorName } : {}),
            ...(authorImage ? { thumbnail: authorImage } : {}),
            metadata: {
              ...((linkedInPost.metadata as Record<string, unknown>) || {}),
              authorJobTitle:
                authorTitle ||
                (linkedInPost.metadata as Record<string, string>)
                  ?.authorJobTitle,
              authorUrl,
              authorFollowers,
              fetchedAt: new Date().toISOString(),
              commentCount,
              activityDate,
              shareUrl,
            },
          })
          .where(eq(savedPosts.id, linkedInPost.id));
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
});
