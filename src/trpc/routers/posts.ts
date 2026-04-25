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
