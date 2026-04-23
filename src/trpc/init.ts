import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import superjson from "superjson";
import { ZodError } from "zod";
import type { User } from "@prisma/client";

// ─── Context ───────────────────────────────────────────────────────────────
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const { userId } = await auth();

  return {
    prisma,
    clerkUserId: userId,
    headers: opts.headers,
  };
};

type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

// ─── tRPC instance ─────────────────────────────────────────────────────────
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// ─── Exports ───────────────────────────────────────────────────────────────
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;

// Public procedure — no auth required
export const publicProcedure = t.procedure;

// Protected procedure — requires Clerk session + DB user record
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.clerkUserId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }

  const user = await ctx.prisma.user.findUnique({
    where: { clerkId: ctx.clerkUserId },
  });

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User record not found. The webhook may not have fired yet.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: user as User,
    },
  });
});
