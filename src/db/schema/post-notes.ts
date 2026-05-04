import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { savedPosts } from "./saved-posts";

export const postNotes = pgTable(
  "PostNote",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    postId: text("postId")
      .notNull()
      .references(() => savedPosts.id, { onDelete: "cascade" }),
    userId: text("userId").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("PostNote_postId_idx").on(table.postId),
    index("PostNote_userId_idx").on(table.userId),
  ],
);
