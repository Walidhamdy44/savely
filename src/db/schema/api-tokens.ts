import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const apiTokens = pgTable(
  "ApiToken",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    token: text("token").notNull().unique(),
    lastUsed: timestamp("lastUsed", { mode: "date" }),
    expiresAt: timestamp("expiresAt", { mode: "date" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("ApiToken_token_idx").on(table.token),
    index("ApiToken_userId_idx").on(table.userId),
  ],
);
