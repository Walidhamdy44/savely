import type { InferSelectModel } from "drizzle-orm";
import { savedPosts } from "@/db/schema/saved-posts";
import { postNotes } from "@/db/schema/post-notes";

/** A saved post record derived from the Drizzle schema */
export type SavedPost = InferSelectModel<typeof savedPosts>;

/** A post note record derived from the Drizzle schema */
export type PostNote = InferSelectModel<typeof postNotes>;
