import type { InferSelectModel } from "drizzle-orm";
import { githubConnections } from "@/db/schema/github-connections";

/** A GitHub connection record derived from the Drizzle schema */
export type GitHubConnection = InferSelectModel<typeof githubConnections>;

/** A GitHub repository as returned from the GitHub API */
export interface GitHubRepo {
  /** Numeric GitHub repository ID */
  id: number;
  /** Repository name (e.g. "my-repo") */
  name: string;
  /** Full repository name including owner (e.g. "owner/my-repo") */
  fullName: string;
  /** Repository description */
  description: string | null;
  /** URL to the repository on GitHub */
  url: string;
  /** Homepage URL if configured */
  homepage: string | null;
  /** Primary programming language */
  language: string | null;
  /** Number of stars */
  stars: number;
  /** Number of forks */
  forks: number;
  /** Repository topic tags */
  topics: string[];
  /** Whether the repo is a fork */
  fork?: boolean;
  /** Whether the repo is archived */
  archived: boolean;
  /** ISO timestamp of last update */
  updatedAt: string;
  /** Owner's GitHub login */
  ownerLogin: string;
  /** Owner's avatar URL */
  ownerAvatar: string;
  /** License name if present */
  license: string | null;
}
