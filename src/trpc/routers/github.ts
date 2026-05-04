import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../init";
import { githubConnections } from "@/db/schema/github-connections";
import { savedPosts } from "@/db/schema/saved-posts";
import { GITHUB_API_BASE } from "@/lib/constants/api";

// GitHub API types
interface GitHubUser {
  login: string;
  avatar_url: string;
  bio: string | null;
  location: string | null;
  public_repos: number;
  followers: number;
  following: number;
  html_url: string;
  name: string | null;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
  fork: boolean;
  archived: boolean;
  updated_at: string;
  pushed_at: string;
  created_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  license: { name: string } | null;
}

/**
 * Fetch a single resource from the GitHub REST API.
 * Throws TRPCError for 404 and 403 (rate-limit) responses.
 */
async function fetchGitHub<T>(path: string): Promise<T> {
  const res = await fetch(`${GITHUB_API_BASE}${path}`, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Savely-App",
    },
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "GitHub user not found",
      });
    }
    if (res.status === 403) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "GitHub API rate limit reached. Try again in a few minutes.",
      });
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `GitHub API error: ${res.status}`,
    });
  }

  return res.json() as Promise<T>;
}

/**
 * Paginate through a GitHub list endpoint, collecting up to `maxPages` pages
 * of 100 items each.
 */
async function fetchAllPages<T>(path: string, maxPages = 10): Promise<T[]> {
  const all: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const separator = path.includes("?") ? "&" : "?";
    const items = await fetchGitHub<T[]>(
      `${path}${separator}per_page=100&page=${page}`,
    );
    all.push(...items);
    if (items.length < 100) break;
  }
  return all;
}

export const githubRouter = createTRPCRouter({
  /** Get the current user's GitHub connection status. */
  getConnection: protectedProcedure.query(async ({ ctx }) => {
    const connection = await ctx.db.query.githubConnections.findFirst({
      where: eq(githubConnections.userId, ctx.user.id),
    });
    return connection ?? null;
  }),

  /** Connect a GitHub account by username. Upserts the connection record. */
  connect: protectedProcedure
    .input(z.object({ username: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      // Verify user exists on GitHub
      const ghUser = await fetchGitHub<GitHubUser>(`/users/${input.username}`);

      const connection = await ctx.db
        .insert(githubConnections)
        .values({
          userId: ctx.user.id,
          username: ghUser.login,
          avatarUrl: ghUser.avatar_url,
          bio: ghUser.bio,
          location: ghUser.location,
          publicRepos: ghUser.public_repos,
          followers: ghUser.followers,
          following: ghUser.following,
        })
        .onConflictDoUpdate({
          target: githubConnections.userId,
          set: {
            username: ghUser.login,
            avatarUrl: ghUser.avatar_url,
            bio: ghUser.bio,
            location: ghUser.location,
            publicRepos: ghUser.public_repos,
            followers: ghUser.followers,
            following: ghUser.following,
          },
        })
        .returning();

      return connection[0];
    }),

  /** Disconnect the current user's GitHub account. */
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .delete(githubConnections)
      .where(eq(githubConnections.userId, ctx.user.id));
    return { success: true };
  }),

  /** Fetch starred repos from GitHub for the connected user. */
  getStarredRepos: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const connection = await ctx.db.query.githubConnections.findFirst({
        where: eq(githubConnections.userId, ctx.user.id),
      });
      if (!connection) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "GitHub not connected",
        });
      }

      const repos = await fetchAllPages<GitHubRepo>(
        `/users/${connection.username}/starred`,
        5,
      );

      let filtered = repos;
      if (input.search?.trim()) {
        const q = input.search.toLowerCase();
        filtered = repos.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.full_name.toLowerCase().includes(q) ||
            r.description?.toLowerCase().includes(q) ||
            r.language?.toLowerCase().includes(q) ||
            r.topics?.some((t) => t.toLowerCase().includes(q)),
        );
      }

      return filtered.map((r) => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        description: r.description,
        url: r.html_url,
        homepage: r.homepage,
        language: r.language,
        stars: r.stargazers_count,
        forks: r.forks_count,
        topics: r.topics || [],
        archived: r.archived,
        updatedAt: r.updated_at,
        ownerLogin: r.owner.login,
        ownerAvatar: r.owner.avatar_url,
        license: r.license?.name || null,
      }));
    }),

  /** Fetch the connected user's own repos from GitHub. */
  getUserRepos: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const connection = await ctx.db.query.githubConnections.findFirst({
        where: eq(githubConnections.userId, ctx.user.id),
      });
      if (!connection) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "GitHub not connected",
        });
      }

      const repos = await fetchAllPages<GitHubRepo>(
        `/users/${connection.username}/repos?sort=updated`,
        3,
      );

      let filtered = repos;
      if (input.search?.trim()) {
        const q = input.search.toLowerCase();
        filtered = repos.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.description?.toLowerCase().includes(q) ||
            r.language?.toLowerCase().includes(q),
        );
      }

      return filtered.map((r) => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        description: r.description,
        url: r.html_url,
        homepage: r.homepage,
        language: r.language,
        stars: r.stargazers_count,
        forks: r.forks_count,
        topics: r.topics || [],
        fork: r.fork,
        archived: r.archived,
        updatedAt: r.updated_at,
        ownerLogin: r.owner.login,
        ownerAvatar: r.owner.avatar_url,
        license: r.license?.name || null,
      }));
    }),

  /** Save a GitHub repo as a SavedPost in Savely. */
  saveRepo: protectedProcedure
    .input(
      z.object({
        repoId: z.number(),
        name: z.string(),
        fullName: z.string(),
        description: z.string().nullable(),
        url: z.string().url(),
        language: z.string().nullable(),
        stars: z.number(),
        forks: z.number(),
        topics: z.array(z.string()),
        ownerLogin: z.string(),
        ownerAvatar: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const result = await ctx.db
        .insert(savedPosts)
        .values({
          userId: ctx.user.id,
          platform: "github",
          externalId: `gh_${input.repoId}`,
          title: input.fullName,
          description: input.description,
          url: input.url,
          thumbnail: input.ownerAvatar,
          authorName: input.ownerLogin,
          sourceType: "github_starred",
          metadata: {
            language: input.language,
            stars: input.stars,
            forks: input.forks,
            topics: input.topics,
          },
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [
            savedPosts.userId,
            savedPosts.platform,
            savedPosts.externalId,
          ],
          set: {
            title: input.fullName,
            description: input.description,
            thumbnail: input.ownerAvatar,
            metadata: {
              language: input.language,
              stars: input.stars,
              forks: input.forks,
              topics: input.topics,
            },
            updatedAt: now,
          },
        })
        .returning();

      return result[0];
    }),

  /** Remove a saved GitHub repo from Savely. */
  unsaveRepo: protectedProcedure
    .input(z.object({ repoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(savedPosts)
        .where(
          and(
            eq(savedPosts.userId, ctx.user.id),
            eq(savedPosts.platform, "github"),
            eq(savedPosts.externalId, `gh_${input.repoId}`),
          ),
        );
      return { success: true };
    }),

  /** Get IDs of all saved GitHub repos for quick lookup in the UI. */
  getSavedRepoIds: protectedProcedure.query(async ({ ctx }) => {
    const saved = await ctx.db
      .select({ externalId: savedPosts.externalId })
      .from(savedPosts)
      .where(
        and(
          eq(savedPosts.userId, ctx.user.id),
          eq(savedPosts.platform, "github"),
        ),
      );
    return saved.map((s) => parseInt(s.externalId.replace("gh_", ""), 10));
  }),
});
