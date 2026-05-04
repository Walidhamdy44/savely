import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { mapTRPCErrorToMessage } from "../error-messages";

/**
 * Feature: clean-architecture-refactor, Property 7: Error code mapping completeness
 * Validates: Requirements 8.2
 */

/** All known tRPC error codes that the mapping must handle */
const KNOWN_TRPC_ERROR_CODES = [
  "UNAUTHORIZED",
  "NOT_FOUND",
  "FORBIDDEN",
  "BAD_REQUEST",
  "TOO_MANY_REQUESTS",
  "INTERNAL_SERVER_ERROR",
  "PRECONDITION_FAILED",
] as const;

describe("Property 7: Error code mapping completeness", () => {
  it("every known tRPC error code maps to a non-empty user-friendly string that is not the code itself", () => {
    fc.assert(
      fc.property(fc.constantFrom(...KNOWN_TRPC_ERROR_CODES), (code) => {
        const message = mapTRPCErrorToMessage(code);
        expect(message).toBeTruthy();
        expect(message.length).toBeGreaterThan(0);
        expect(message).not.toBe(code);
      }),
      { numRuns: 100 },
    );
  });

  it("mapTRPCErrorToMessage never throws for any valid error code", () => {
    fc.assert(
      fc.property(fc.constantFrom(...KNOWN_TRPC_ERROR_CODES), (code) => {
        expect(() => mapTRPCErrorToMessage(code)).not.toThrow();
      }),
      { numRuns: 100 },
    );
  });

  it("unknown error codes get a sensible default message", () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1 })
          .filter(
            (s) => !(KNOWN_TRPC_ERROR_CODES as readonly string[]).includes(s),
          ),
        (unknownCode) => {
          const message = mapTRPCErrorToMessage(unknownCode);
          expect(message).toBeTruthy();
          expect(message.length).toBeGreaterThan(0);
          expect(message).toBe("An unexpected error occurred.");
        },
      ),
      { numRuns: 100 },
    );
  });
});
