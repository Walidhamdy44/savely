import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { createTRPCRouter, protectedProcedure } from "../init";
import { apiTokens } from "@/db/schema/api-tokens";
import { hashToken, generateToken } from "@/lib/auth/token-utils";

export const tokensRouter = createTRPCRouter({
  /** List all tokens for the current user (without revealing the raw token). */
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: apiTokens.id,
        name: apiTokens.name,
        lastUsed: apiTokens.lastUsed,
        expiresAt: apiTokens.expiresAt,
        createdAt: apiTokens.createdAt,
      })
      .from(apiTokens)
      .where(eq(apiTokens.userId, ctx.user.id))
      .orderBy(desc(apiTokens.createdAt));
  }),

  /** Create a new API token. Returns the raw token only once. */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        expiresInDays: z.number().int().min(1).max(365).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const rawToken = generateToken();
      const hashedToken = hashToken(rawToken);

      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      const inserted = await ctx.db
        .insert(apiTokens)
        .values({
          id: createId(),
          userId: ctx.user.id,
          name: input.name,
          token: hashedToken,
          expiresAt,
        })
        .returning();

      const token = inserted[0];

      return {
        id: token.id,
        name: token.name,
        token: rawToken,
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
      };
    }),

  /** Delete a token by ID (verifies it belongs to the current user). */
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(apiTokens)
        .where(
          and(eq(apiTokens.id, input.id), eq(apiTokens.userId, ctx.user.id)),
        )
        .returning({ id: apiTokens.id });

      if (deleted.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Token not found or already deleted",
        });
      }

      return { success: true };
    }),
});
