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

  let user = await ctx.prisma.user.findUnique({
    where: { clerkId: ctx.clerkUserId },
  });

  // Auto-create user if webhook hasn't fired yet (common in local dev)
  if (!user) {
    try {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(ctx.clerkUserId);
      const email = clerkUser.emailAddresses[0]?.emailAddress;

      if (email) {
        user = await ctx.prisma.user.upsert({
          where: { clerkId: ctx.clerkUserId },
          create: {
            clerkId: ctx.clerkUserId,
            email,
            username: clerkUser.username ?? null,
            imageUrl: clerkUser.imageUrl,
          },
          update: {},
        });
      }
    } catch {
      // If Clerk API fails, fall through to the error below
    }
  }

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User record not found. Please try again in a moment.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: user as User,
    },
  });
});
