import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import { TRPCError } from "@trpc/server";
import { Platform, SourceType } from "@prisma/client";

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

async function fetchGitHub<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
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
  // Get connection status
  getConnection: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.gitHubConnection.findUnique({
      where: { userId: ctx.user.id },
    });
  }),

  // Connect by username
  connect: protectedProcedure
    .input(z.object({ username: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      // Verify user exists on GitHub
      const ghUser = await fetchGitHub<GitHubUser>(`/users/${input.username}`);

      const connection = await ctx.prisma.gitHubConnection.upsert({
        where: { userId: ctx.user.id },
        create: {
          userId: ctx.user.id,
          username: ghUser.login,
          avatarUrl: ghUser.avatar_url,
          bio: ghUser.bio,
          location: ghUser.location,
          publicRepos: ghUser.public_repos,
          followers: ghUser.followers,
          following: ghUser.following,
        },
        update: {
          username: ghUser.login,
          avatarUrl: ghUser.avatar_url,
          bio: ghUser.bio,
          location: ghUser.location,
          publicRepos: ghUser.public_repos,
          followers: ghUser.followers,
          following: ghUser.following,
        },
      });

      return connection;
    }),

  // Disconnect
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.gitHubConnection.deleteMany({
      where: { userId: ctx.user.id },
    });
    return { success: true };
  }),

  // Fetch starred repos from GitHub
  getStarredRepos: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const connection = await ctx.prisma.gitHubConnection.findUnique({
        where: { userId: ctx.user.id },
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

  // Fetch user's own repos
  getUserRepos: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const connection = await ctx.prisma.gitHubConnection.findUnique({
        where: { userId: ctx.user.id },
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

  // Save a repo to Savely
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
      return ctx.prisma.savedPost.upsert({
        where: {
          userId_platform_externalId: {
            userId: ctx.user.id,
            platform: Platform.github,
            externalId: `gh_${input.repoId}`,
          },
        },
        create: {
          userId: ctx.user.id,
          platform: Platform.github,
          externalId: `gh_${input.repoId}`,
          title: input.fullName,
          description: input.description,
          url: input.url,
          thumbnail: input.ownerAvatar,
          authorName: input.ownerLogin,
          sourceType: SourceType.github_starred,
          metadata: {
            language: input.language,
            stars: input.stars,
            forks: input.forks,
            topics: input.topics,
          },
        },
        update: {
          title: input.fullName,
          description: input.description,
          thumbnail: input.ownerAvatar,
          metadata: {
            language: input.language,
            stars: input.stars,
            forks: input.forks,
            topics: input.topics,
          },
        },
      });
    }),

  // Unsave a repo
  unsaveRepo: protectedProcedure
    .input(z.object({ repoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.savedPost.deleteMany({
        where: {
          userId: ctx.user.id,
          platform: Platform.github,
          externalId: `gh_${input.repoId}`,
        },
      });
      return { success: true };
    }),

  // Get saved repo IDs for quick lookup
  getSavedRepoIds: protectedProcedure.query(async ({ ctx }) => {
    const saved = await ctx.prisma.savedPost.findMany({
      where: { userId: ctx.user.id, platform: Platform.github },
      select: { externalId: true },
    });
    return saved.map((s) => parseInt(s.externalId.replace("gh_", ""), 10));
  }),
});
