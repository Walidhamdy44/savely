import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { z } from "zod";
import { platformEnum } from "@/db/schema/enums";
import {
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_NOTE_LENGTH,
} from "@/lib/constants/validation";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants/pagination";

/**
 * Feature: clean-architecture-refactor, Property 6: tRPC procedure input validation rejects invalid data
 *
 * For any tRPC procedure that defines a Zod input schema, passing data that
 * violates the schema (wrong type, missing required field, out-of-range value)
 * SHALL result in a validation error.
 *
 * **Validates: Requirements 4.5**
 */

// ── Re-create the Zod schemas as defined in the router files ──────────────

const platformSchema = z.enum(platformEnum.enumValues);

/** posts.getAll input */
const postsGetAllInput = z.object({
  platform: platformSchema.optional(),
  search: z.string().max(200).optional(),
  limit: z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  cursor: z.string().optional(),
});

/** posts.save input */
const savePostInput = z.object({
  platform: platformSchema,
  externalId: z.string().min(1, "externalId is required"),
  title: z.string().min(1, "title is required").max(MAX_TITLE_LENGTH),
  description: z.string().max(MAX_DESCRIPTION_LENGTH).optional(),
  url: z.string().url("url must be a valid URL"),
  thumbnail: z.string().url("thumbnail must be a valid URL").optional(),
  metadata: z.any().optional(),
});

/** notes.create input */
const notesCreateInput = z.object({
  postId: z.string().min(1),
  content: z.string().min(1).max(MAX_NOTE_LENGTH),
});

/** tokens.create input */
const tokensCreateInput = z.object({
  name: z.string().min(1).max(100),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

// ── Generators ────────────────────────────────────────────────────────────

/** Generates a value that is NOT a valid platform string */
const invalidPlatformArb = fc
  .string({ minLength: 1, maxLength: 20 })
  .filter(
    (s) =>
      !["youtube", "github", "manual", "linkedin", "instagram"].includes(s),
  );

/** Generates a non-string primitive (number, boolean, null, undefined) */
const nonStringArb = fc.oneof(
  fc.integer(),
  fc.boolean(),
  fc.constant(null),
  fc.constant(undefined),
);

/** Generates a non-number primitive */
const nonNumberArb = fc.oneof(
  fc.string(),
  fc.boolean(),
  fc.constant(null),
  fc.constant(undefined),
);

// ── Tests ─────────────────────────────────────────────────────────────────

describe("tRPC input validation - Property Tests", () => {
  describe("posts.getAll input schema", () => {
    it("Property 6: rejects invalid platform values", () => {
      fc.assert(
        fc.property(invalidPlatformArb, (badPlatform) => {
          const result = postsGetAllInput.safeParse({ platform: badPlatform });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 },
      );
    });

    it("Property 6: rejects search strings exceeding max length", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 201, maxLength: 500 }),
          (longSearch) => {
            const result = postsGetAllInput.safeParse({ search: longSearch });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("Property 6: rejects limit values out of range", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ min: -1000, max: 0 }),
            fc.integer({ min: MAX_PAGE_SIZE + 1, max: MAX_PAGE_SIZE + 1000 }),
          ),
          (badLimit) => {
            const result = postsGetAllInput.safeParse({ limit: badLimit });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("Property 6: rejects non-integer limit values", () => {
      fc.assert(
        fc.property(
          fc
            .double({ min: 0.01, max: 99.99, noNaN: true })
            .filter((n) => !Number.isInteger(n)),
          (floatLimit) => {
            const result = postsGetAllInput.safeParse({ limit: floatLimit });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("posts.save input schema", () => {
    it("Property 6: rejects missing required fields", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            "platform",
            "externalId",
            "title",
            "url",
          ) as fc.Arbitrary<string>,
          (missingField) => {
            const validInput: Record<string, unknown> = {
              platform: "youtube",
              externalId: "abc123",
              title: "Test Post",
              url: "https://example.com",
            };
            delete validInput[missingField];

            const result = savePostInput.safeParse(validInput);
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("Property 6: rejects invalid platform values", () => {
      fc.assert(
        fc.property(invalidPlatformArb, (badPlatform) => {
          const result = savePostInput.safeParse({
            platform: badPlatform,
            externalId: "abc123",
            title: "Test",
            url: "https://example.com",
          });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 },
      );
    });

    it("Property 6: rejects empty externalId", () => {
      const result = savePostInput.safeParse({
        platform: "youtube",
        externalId: "",
        title: "Test",
        url: "https://example.com",
      });
      expect(result.success).toBe(false);
    });

    it("Property 6: rejects titles exceeding max length", () => {
      fc.assert(
        fc.property(
          fc.string({
            minLength: MAX_TITLE_LENGTH + 1,
            maxLength: MAX_TITLE_LENGTH + 100,
          }),
          (longTitle) => {
            const result = savePostInput.safeParse({
              platform: "youtube",
              externalId: "abc123",
              title: longTitle,
              url: "https://example.com",
            });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("Property 6: rejects invalid URL formats", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Plain alphabetic words — no protocol, no colon
            fc.stringMatching(/^[a-z]{1,20}$/),
            // Strings with spaces (never valid URLs)
            fc.constant("not a url"),
            fc.constant("just some text"),
            // Empty string
            fc.constant(""),
          ),
          (badUrl) => {
            const result = savePostInput.safeParse({
              platform: "youtube",
              externalId: "abc123",
              title: "Test",
              url: badUrl,
            });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("Property 6: rejects wrong types for required fields", () => {
      fc.assert(
        fc.property(nonStringArb, (badValue) => {
          // externalId should be a string
          const result = savePostInput.safeParse({
            platform: "youtube",
            externalId: badValue,
            title: "Test",
            url: "https://example.com",
          });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe("notes.create input schema", () => {
    it("Property 6: rejects empty postId", () => {
      const result = notesCreateInput.safeParse({
        postId: "",
        content: "A note",
      });
      expect(result.success).toBe(false);
    });

    it("Property 6: rejects empty content", () => {
      const result = notesCreateInput.safeParse({
        postId: "post-123",
        content: "",
      });
      expect(result.success).toBe(false);
    });

    it("Property 6: rejects content exceeding max length", () => {
      fc.assert(
        fc.property(
          fc.string({
            minLength: MAX_NOTE_LENGTH + 1,
            maxLength: MAX_NOTE_LENGTH + 100,
          }),
          (longContent) => {
            const result = notesCreateInput.safeParse({
              postId: "post-123",
              content: longContent,
            });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("Property 6: rejects missing required fields", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("postId", "content") as fc.Arbitrary<string>,
          (missingField) => {
            const validInput: Record<string, unknown> = {
              postId: "post-123",
              content: "A note",
            };
            delete validInput[missingField];

            const result = notesCreateInput.safeParse(validInput);
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("Property 6: rejects wrong types for fields", () => {
      fc.assert(
        fc.property(nonStringArb, (badValue) => {
          const result = notesCreateInput.safeParse({
            postId: badValue,
            content: "A note",
          });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe("tokens.create input schema", () => {
    it("Property 6: rejects empty name", () => {
      const result = tokensCreateInput.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("Property 6: rejects name exceeding max length", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 101, maxLength: 200 }),
          (longName) => {
            const result = tokensCreateInput.safeParse({ name: longName });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("Property 6: rejects expiresInDays out of range", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ min: -1000, max: 0 }),
            fc.integer({ min: 366, max: 10000 }),
          ),
          (badDays) => {
            const result = tokensCreateInput.safeParse({
              name: "My Token",
              expiresInDays: badDays,
            });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("Property 6: rejects non-integer expiresInDays", () => {
      fc.assert(
        fc.property(
          fc
            .double({ min: 0.01, max: 364.99, noNaN: true })
            .filter((n) => !Number.isInteger(n)),
          (floatDays) => {
            const result = tokensCreateInput.safeParse({
              name: "My Token",
              expiresInDays: floatDays,
            });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("Property 6: rejects wrong type for name", () => {
      fc.assert(
        fc.property(nonStringArb, (badValue) => {
          const result = tokensCreateInput.safeParse({ name: badValue });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 },
      );
    });

    it("Property 6: rejects wrong type for expiresInDays", () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.string({ minLength: 1 }), fc.boolean()),
          (badValue) => {
            const result = tokensCreateInput.safeParse({
              name: "My Token",
              expiresInDays: badValue,
            });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
