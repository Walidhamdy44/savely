import { db } from "./client";
import { savedPosts } from "./schema/saved-posts";
import { eq, and, desc, sql } from "drizzle-orm";

/** Prepared: list posts by userId with cursor pagination */
export const listPostsByUser = db
  .select()
  .from(savedPosts)
  .where(eq(savedPosts.userId, sql.placeholder("userId")))
  .orderBy(desc(savedPosts.savedAt))
  .limit(sql.placeholder("limit"))
  .prepare("list_posts_by_user");

/** Prepared: get post by id and userId */
export const getPostById = db
  .select()
  .from(savedPosts)
  .where(
    and(
      eq(savedPosts.id, sql.placeholder("id")),
      eq(savedPosts.userId, sql.placeholder("userId")),
    ),
  )
  .prepare("get_post_by_id");

/** Prepared: count posts grouped by platform */
export const countPostsByPlatform = db
  .select({
    platform: savedPosts.platform,
    count: sql<number>`count(*)`,
  })
  .from(savedPosts)
  .where(eq(savedPosts.userId, sql.placeholder("userId")))
  .groupBy(savedPosts.platform)
  .prepare("count_posts_by_platform");
