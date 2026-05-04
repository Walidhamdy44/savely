import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../init";
import { postNotes } from "@/db/schema/post-notes";
import { savedPosts } from "@/db/schema/saved-posts";
import { MAX_NOTE_LENGTH } from "@/lib/constants/validation";

export const notesRouter = createTRPCRouter({
  /** List all notes for a given post (verifies post ownership first). */
  list: protectedProcedure
    .input(z.object({ postId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.db
        .select({ id: savedPosts.id })
        .from(savedPosts)
        .where(
          and(
            eq(savedPosts.id, input.postId),
            eq(savedPosts.userId, ctx.user.id),
          ),
        )
        .limit(1);

      if (post.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      return ctx.db.query.postNotes.findMany({
        where: eq(postNotes.postId, input.postId),
        orderBy: [desc(postNotes.createdAt)],
      });
    }),

  /** Create a note on a post (verifies post ownership first). */
  create: protectedProcedure
    .input(
      z.object({
        postId: z.string().min(1),
        content: z.string().min(1).max(MAX_NOTE_LENGTH),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db
        .select({ id: savedPosts.id })
        .from(savedPosts)
        .where(
          and(
            eq(savedPosts.id, input.postId),
            eq(savedPosts.userId, ctx.user.id),
          ),
        )
        .limit(1);

      if (post.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      const inserted = await ctx.db
        .insert(postNotes)
        .values({
          postId: input.postId,
          userId: ctx.user.id,
          content: input.content,
        })
        .returning();

      return inserted[0];
    }),

  /** Delete a note by ID (verifies the note belongs to the current user). */
  delete: protectedProcedure
    .input(z.object({ noteId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(postNotes)
        .where(
          and(
            eq(postNotes.id, input.noteId),
            eq(postNotes.userId, ctx.user.id),
          ),
        )
        .returning({ id: postNotes.id });

      if (deleted.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Note not found or already deleted",
        });
      }

      return { success: true };
    }),
});
