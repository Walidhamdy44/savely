import type { InferSelectModel } from "drizzle-orm";
import { apiTokens } from "@/db/schema/api-tokens";

/** An API token record derived from the Drizzle schema */
export type ApiToken = InferSelectModel<typeof apiTokens>;
