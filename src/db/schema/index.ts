import { relations } from "drizzle-orm";
import { users } from "./users";
import { accounts } from "./accounts";
import { savedPosts } from "./saved-posts";
import { apiTokens } from "./api-tokens";
import { postNotes } from "./post-notes";
import { githubConnections } from "./github-connections";

export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  savedPosts: many(savedPosts),
  apiTokens: many(apiTokens),
  githubConnection: one(githubConnections),
}));

export const savedPostsRelations = relations(savedPosts, ({ one, many }) => ({
  user: one(users, { fields: [savedPosts.userId], references: [users.id] }),
  notes: many(postNotes),
}));

export const postNotesRelations = relations(postNotes, ({ one }) => ({
  post: one(savedPosts, {
    fields: [postNotes.postId],
    references: [savedPosts.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const apiTokensRelations = relations(apiTokens, ({ one }) => ({
  user: one(users, { fields: [apiTokens.userId], references: [users.id] }),
}));

export const githubConnectionsRelations = relations(
  githubConnections,
  ({ one }) => ({
    user: one(users, {
      fields: [githubConnections.userId],
      references: [users.id],
    }),
  }),
);

// Re-export all schemas
export { users } from "./users";
export { accounts } from "./accounts";
export { savedPosts } from "./saved-posts";
export { apiTokens } from "./api-tokens";
export { postNotes } from "./post-notes";
export { githubConnections } from "./github-connections";
export { platformEnum, sourceTypeEnum } from "./enums";
