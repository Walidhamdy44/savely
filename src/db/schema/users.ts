import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const users = pgTable("User", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  clerkId: text("clerkId").notNull().unique(),
  email: text("email").notNull().unique(),
  username: text("username"),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
