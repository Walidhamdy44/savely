import { pgEnum } from "drizzle-orm/pg-core";

export const platformEnum = pgEnum("Platform", [
  "youtube",
  "github",
  "manual",
  "linkedin",
  "instagram",
]);

export const sourceTypeEnum = pgEnum("SourceType", [
  "manual",
  "extension",
  "youtube_liked",
  "github_starred",
]);
