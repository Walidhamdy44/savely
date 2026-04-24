import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import { randomBytes, createHash } from "crypto";

// Generate a secure random token
function generateToken(): string {
  return `sav_${randomBytes(32).toString("hex")}`;
}

// Hash token for storage (we only store hashed version)
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const tokensRouter = createTRPCRouter({
  // List all tokens for the current user (without revealing the actual token)
  list: protectedProcedure.query(async ({ ctx }) => {
    const tokens = await ctx.prisma.apiToken.findMany({
      where: { userId: ctx.user.id },
      select: {
        id: true,
        name: true,
        lastUsed: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return tokens;
  }),

  // Create a new API token
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

      const token = await ctx.prisma.apiToken.create({
        data: {
          id: randomBytes(12).toString("hex"),
          userId: ctx.user.id,
          name: input.name,
          token: hashedToken,
          expiresAt,
        },
      });

      // Return the raw token only once - user must save it
      return {
        id: token.id,
        name: token.name,
        token: rawToken, // Only returned on creation!
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
      };
    }),

  // Delete a token
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.prisma.apiToken.deleteMany({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
      });

      if (deleted.count === 0) {
        throw new Error("Token not found");
      }

      return { success: true };
    }),
});
