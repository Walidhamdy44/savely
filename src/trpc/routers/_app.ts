import { createTRPCRouter } from "../init";
import { postsRouter } from "./posts";
import { userRouter } from "./user";

export const appRouter = createTRPCRouter({
  posts: postsRouter,
  user: userRouter,
});

// This type is imported by client.tsx and server.tsx
export type AppRouter = typeof appRouter;
