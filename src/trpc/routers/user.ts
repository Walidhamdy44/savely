import { createTRPCRouter, protectedProcedure } from "../init";

export const userRouter = createTRPCRouter({
  // Returns the currently authenticated user's DB record
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),
});
