import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { hashToken } from "@/lib/auth/token-utils";
import { syncPayloadSchema } from "@/lib/sync/schemas";
import { getHandler } from "@/lib/sync";
import { db } from "@/db/client";
import { apiTokens } from "@/db/schema/api-tokens";
import { users } from "@/db/schema/users";

/** CORS headers for browser extension requests */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/** Handle preflight requests */
export async function OPTIONS() {
  return NextResponse.json(null, { headers: corsHeaders });
}

/** Return a JSON response with CORS headers */
function jsonResponse(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, { ...init, headers: corsHeaders });
}

/**
 * Extract and validate the Bearer token from the Authorization header.
 * Returns the raw token string or null if missing/malformed.
 */
function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

/** POST /api/extension/sync — Sync posts from the browser extension */
export async function POST(request: NextRequest) {
  try {
    // 1. Extract Bearer token
    const rawToken = extractBearerToken(request);
    if (!rawToken) {
      return jsonResponse(
        { error: "Missing or invalid Authorization header" },
        { status: 401 },
      );
    }

    // 2. Hash and look up token
    const hashedToken = hashToken(rawToken);
    const [tokenRow] = await db
      .select()
      .from(apiTokens)
      .where(eq(apiTokens.token, hashedToken))
      .limit(1);

    if (!tokenRow) {
      return jsonResponse({ error: "Invalid token" }, { status: 401 });
    }

    // 3. Check expiration
    if (tokenRow.expiresAt && tokenRow.expiresAt < new Date()) {
      return jsonResponse({ error: "Token expired" }, { status: 401 });
    }

    // 4. Update lastUsed timestamp
    await db
      .update(apiTokens)
      .set({ lastUsed: new Date() })
      .where(eq(apiTokens.id, tokenRow.id));

    // 5. Validate request body with Zod
    const body = await request.json();
    const parsed = syncPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse(
        { error: "Invalid payload", details: parsed.error.issues },
        { status: 400 },
      );
    }

    // 6. Get platform handler
    const handler = getHandler(parsed.data.platform);
    if (!handler) {
      return jsonResponse(
        { error: `Unsupported platform: ${parsed.data.platform}` },
        { status: 400 },
      );
    }

    // 7. Delegate to handler and return result
    const result = await handler.handle(tokenRow.userId, parsed.data, db);

    return jsonResponse({
      success: true,
      saved: result.saved,
      skipped: result.skipped,
      total: result.saved + result.skipped,
      ...(result.skipped > 0 && result.errors.length > 0
        ? { debugErrors: result.errors }
        : {}),
    });
  } catch (error) {
    console.error("Sync error:", error);
    return jsonResponse({ error: "Internal server error" }, { status: 500 });
  }
}

/** GET /api/extension/sync — Verify token validity */
export async function GET(request: NextRequest) {
  const rawToken = extractBearerToken(request);
  if (!rawToken) {
    return jsonResponse(
      { error: "Missing or invalid Authorization header" },
      { status: 401 },
    );
  }

  const hashedToken = hashToken(rawToken);
  const [tokenRow] = await db
    .select()
    .from(apiTokens)
    .where(eq(apiTokens.token, hashedToken))
    .limit(1);

  if (!tokenRow) {
    return jsonResponse({ error: "Invalid token" }, { status: 401 });
  }

  if (tokenRow.expiresAt && tokenRow.expiresAt < new Date()) {
    return jsonResponse({ error: "Token expired" }, { status: 401 });
  }

  const [user] = await db
    .select({ email: users.email, username: users.username })
    .from(users)
    .where(eq(users.id, tokenRow.userId))
    .limit(1);

  return jsonResponse({
    valid: true,
    user: user?.username || user?.email,
    tokenName: tokenRow.name,
  });
}
