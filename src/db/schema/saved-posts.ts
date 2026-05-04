import {
  pgTable,
  text,
  timestamp,
  json,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users";
import { platformEnum, sourceTypeEnum } from "./enums";

export const savedPosts = pgTable(
  "SavedPost",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platform: platformEnum("platform").notNull(),
    externalId: text("externalId").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    url: text("url").notNull(),
    thumbnail: text("thumbnail"),
    metadata: json("metadata").$type<Record<string, unknown> | null>(),
    savedAt: timestamp("savedAt", { mode: "date" }).defaultNow().notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    authorName: text("authorName"),
    sourceType: sourceTypeEnum("sourceType").default("manual").notNull(),
    note: text("note"),
  },
  (table) => [
    uniqueIndex("SavedPost_userId_platform_externalId_key").on(
      table.userId,
      table.platform,
      table.externalId,
    ),
    uniqueIndex("SavedPost_userId_url_key").on(table.userId, table.url),
    index("SavedPost_userId_platform_idx").on(table.userId, table.platform),
    index("SavedPost_userId_savedAt_idx").on(table.userId, table.savedAt),
  ],
);
