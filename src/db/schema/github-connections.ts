import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users";

export const githubConnections = pgTable("GitHubConnection", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("userId")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  avatarUrl: text("avatarUrl"),
  bio: text("bio"),
  location: text("location"),
  publicRepos: integer("publicRepos").default(0).notNull(),
  followers: integer("followers").default(0).notNull(),
  following: integer("following").default(0).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
