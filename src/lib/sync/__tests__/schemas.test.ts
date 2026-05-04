import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  syncPayloadSchema,
  linkedInSyncPostSchema,
  youtubeSyncVideoSchema,
  instagramSyncPostSchema,
} from "../schemas";

/**
 * Feature: clean-architecture-refactor, Property 8: Sync payload validation rejects malformed data
 *
 * For any sync request payload that is missing required fields, has wrong types,
 * or contains an unsupported platform value, the Zod validation schema SHALL
 * reject it.
 *
 * **Validates: Requirements 9.2, 9.3**
 */

// ── Generators ────────────────────────────────────────────────────────────

/** Generates a platform string that is NOT one of the supported values */
const unsupportedPlatformArb = fc
  .string({ minLength: 1, maxLength: 30 })
  .filter((s) => !["linkedin", "youtube", "instagram"].includes(s));

/** Generates a non-string primitive */
const nonStringArb = fc.oneof(
  fc.integer(),
  fc.boolean(),
  fc.constant(null),
  fc.constant(undefined),
);

/** Generates a valid LinkedIn post object */
const validLinkedInPostArb = fc.record({
  authorName: fc.string({ minLength: 1, maxLength: 50 }),
  authorProfileURL: fc.string({ minLength: 1, maxLength: 100 }),
  postURL: fc.string({ minLength: 1, maxLength: 200 }),
  postContent: fc.string({ minLength: 0, maxLength: 200 }),
  scrapedAt: fc.constant(new Date().toISOString()),
});

/** Generates a valid YouTube video object */
const validYouTubeVideoArb = fc.record({
  videoId: fc.string({ minLength: 1, maxLength: 20 }),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  channelName: fc.string({ minLength: 1, maxLength: 50 }),
  videoUrl: fc.string({ minLength: 1, maxLength: 200 }),
  scrapedAt: fc.constant(new Date().toISOString()),
});

/** Generates a valid Instagram post object */
const validInstagramPostArb = fc.record({
  postURL: fc.string({ minLength: 1, maxLength: 200 }),
  postImage: fc.string({ minLength: 1, maxLength: 200 }),
  postCaption: fc.string({ minLength: 0, maxLength: 200 }),
  scrapedAt: fc.constant(new Date().toISOString()),
});

// ── Tests ─────────────────────────────────────────────────────────────────

describe("Sync payload validation - Property Tests", () => {
  describe("syncPayloadSchema - unsupported platform", () => {
    it("Property 8: rejects unsupported platform values", () => {
      fc.assert(
        fc.property(unsupportedPlatformArb, (badPlatform) => {
          const result = syncPayloadSchema.safeParse({
            platform: badPlatform,
            posts: [],
          });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 },
      );
    });

    it("Property 8: rejects missing platform field", () => {
      const result = syncPayloadSchema.safeParse({ posts: [] });
      expect(result.success).toBe(false);
    });

    it("Property 8: rejects non-string platform values", () => {
      fc.assert(
        fc.property(nonStringArb, (badPlatform) => {
          const result = syncPayloadSchema.safeParse({
            platform: badPlatform,
            posts: [],
          });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe("syncPayloadSchema - wrong array key", () => {
    it("Property 8: rejects linkedin payload with videos instead of posts", () => {
      fc.assert(
        fc.property(
          fc.array(validLinkedInPostArb, { minLength: 1, maxLength: 3 }),
          (posts) => {
            const result = syncPayloadSchema.safeParse({
              platform: "linkedin",
              videos: posts,
            });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("Property 8: rejects youtube payload with posts instead of videos", () => {
      fc.assert(
        fc.property(
          fc.array(validYouTubeVideoArb, { minLength: 1, maxLength: 3 }),
          (videos) => {
            const result = syncPayloadSchema.safeParse({
              platform: "youtube",
              posts: videos,
            });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("linkedInSyncPostSchema - missing required fields", () => {
    it("Property 8: rejects LinkedIn posts missing required fields", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            "authorName",
            "authorProfileURL",
            "postURL",
            "postContent",
            "scrapedAt",
          ) as fc.Arbitrary<string>,
          validLinkedInPostArb,
          (missingField, post) => {
            const incomplete = { ...post } as Record<string, unknown>;
            delete incomplete[missingField];
            const result = linkedInSyncPostSchema.safeParse(incomplete);
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("Property 8: rejects LinkedIn posts with wrong types for required fields", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            "authorName",
            "authorProfileURL",
            "postURL",
            "postContent",
            "scrapedAt",
          ) as fc.Arbitrary<string>,
          nonStringArb,
          (field, badValue) => {
            const post: Record<string, unknown> = {
              authorName: "Test Author",
              authorProfileURL: "https://linkedin.com/in/test",
              postURL: "https://linkedin.com/post/123",
              postContent: "Some content",
              scrapedAt: new Date().toISOString(),
            };
            post[field] = badValue;
            const result = linkedInSyncPostSchema.safeParse(post);
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("youtubeSyncVideoSchema - missing required fields", () => {
    it("Property 8: rejects YouTube videos missing required fields", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            "videoId",
            "title",
            "channelName",
            "videoUrl",
            "scrapedAt",
          ) as fc.Arbitrary<string>,
          validYouTubeVideoArb,
          (missingField, video) => {
            const incomplete = { ...video } as Record<string, unknown>;
            delete incomplete[missingField];
            const result = youtubeSyncVideoSchema.safeParse(incomplete);
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("Property 8: rejects YouTube videos with wrong types for required fields", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            "videoId",
            "title",
            "channelName",
            "videoUrl",
            "scrapedAt",
          ) as fc.Arbitrary<string>,
          nonStringArb,
          (field, badValue) => {
            const video: Record<string, unknown> = {
              videoId: "abc123",
              title: "Test Video",
              channelName: "Test Channel",
              videoUrl: "https://youtube.com/watch?v=abc123",
              scrapedAt: new Date().toISOString(),
            };
            video[field] = badValue;
            const result = youtubeSyncVideoSchema.safeParse(video);
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("instagramSyncPostSchema - missing required fields", () => {
    it("Property 8: rejects Instagram posts missing required fields", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            "postURL",
            "postImage",
            "postCaption",
            "scrapedAt",
          ) as fc.Arbitrary<string>,
          validInstagramPostArb,
          (missingField, post) => {
            const incomplete = { ...post } as Record<string, unknown>;
            delete incomplete[missingField];
            const result = instagramSyncPostSchema.safeParse(incomplete);
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("Property 8: rejects Instagram posts with wrong types for required fields", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            "postURL",
            "postImage",
            "postCaption",
            "scrapedAt",
          ) as fc.Arbitrary<string>,
          nonStringArb,
          (field, badValue) => {
            const post: Record<string, unknown> = {
              postURL: "https://instagram.com/p/abc123",
              postImage: "https://instagram.com/image.jpg",
              postCaption: "A caption",
              scrapedAt: new Date().toISOString(),
            };
            post[field] = badValue;
            const result = instagramSyncPostSchema.safeParse(post);
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("syncPayloadSchema - full payload with malformed items", () => {
    it("Property 8: rejects linkedin payload with malformed posts", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            "authorName",
            "authorProfileURL",
            "postURL",
            "postContent",
            "scrapedAt",
          ) as fc.Arbitrary<string>,
          (missingField) => {
            const post: Record<string, unknown> = {
              authorName: "Test Author",
              authorProfileURL: "https://linkedin.com/in/test",
              postURL: "https://linkedin.com/post/123",
              postContent: "Some content",
              scrapedAt: new Date().toISOString(),
            };
            delete post[missingField];

            const result = syncPayloadSchema.safeParse({
              platform: "linkedin",
              posts: [post],
            });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("Property 8: rejects youtube payload with malformed videos", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            "videoId",
            "title",
            "channelName",
            "videoUrl",
            "scrapedAt",
          ) as fc.Arbitrary<string>,
          (missingField) => {
            const video: Record<string, unknown> = {
              videoId: "abc123",
              title: "Test Video",
              channelName: "Test Channel",
              videoUrl: "https://youtube.com/watch?v=abc123",
              scrapedAt: new Date().toISOString(),
            };
            delete video[missingField];

            const result = syncPayloadSchema.safeParse({
              platform: "youtube",
              videos: [video],
            });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("Property 8: rejects instagram payload with malformed posts", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            "postURL",
            "postImage",
            "postCaption",
            "scrapedAt",
          ) as fc.Arbitrary<string>,
          (missingField) => {
            const post: Record<string, unknown> = {
              postURL: "https://instagram.com/p/abc123",
              postImage: "https://instagram.com/image.jpg",
              postCaption: "A caption",
              scrapedAt: new Date().toISOString(),
            };
            delete post[missingField];

            const result = syncPayloadSchema.safeParse({
              platform: "instagram",
              posts: [post],
            });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
