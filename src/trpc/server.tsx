import "server-only";

import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { cache } from "react";
import { createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routers/_app";

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy({
  ctx: async () =>
    createTRPCContext({
      headers: await headers(),
    }),
  router: appRouter,
  queryClient: getQueryClient,
});

// Server caller for direct data access in server components
export const caller = appRouter.createCaller(async () =>
  createTRPCContext({ headers: await headers() }),
);

// Helper component for hydrating client with server-prefetched data
export function HydrateClient({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}

// Helper function for prefetching queries in server components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function prefetch(queryOptions: any) {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(queryOptions);
}
