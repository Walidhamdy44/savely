import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users";
import { platformEnum } from "./enums";

export const accounts = pgTable(
  "Account",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platform: platformEnum("platform").notNull(),
    accessToken: text("accessToken").notNull(),
    refreshToken: text("refreshToken"),
    expiresAt: timestamp("expiresAt", { mode: "date" }),
    scope: text("scope"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("Account_userId_platform_key").on(table.userId, table.platform),
    index("Account_userId_idx").on(table.userId),
  ],
);
