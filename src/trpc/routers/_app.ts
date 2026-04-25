import { createTRPCRouter } from "../init";
import { postsRouter } from "./posts";
import { userRouter } from "./user";
import { tokensRouter } from "./tokens";
import { githubRouter } from "./github";

export const appRouter = createTRPCRouter({
  posts: postsRouter,
  user: userRouter,
  tokens: tokensRouter,
  github: githubRouter,
});

// This type is imported by client.tsx and server.tsx
export type AppRouter = typeof appRouter;
