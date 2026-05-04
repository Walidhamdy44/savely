import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { hashToken, generateToken, validateToken } from "../token-utils";

/**
 * Feature: clean-architecture-refactor, Property 9: Token hashing determinism and validation round-trip
 * Validates: Requirements 9.5
 */
describe("Property 9: Token hashing determinism and validation round-trip", () => {
  it("hashToken is deterministic — same input always produces same output", () => {
    fc.assert(
      fc.property(fc.string(), (rawToken) => {
        const hash1 = hashToken(rawToken);
        const hash2 = hashToken(rawToken);
        expect(hash1).toBe(hash2);
      }),
      { numRuns: 100 },
    );
  });

  it("validateToken round-trips — validateToken(token, hashToken(token)) returns true", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (rawToken) => {
        const hash = hashToken(rawToken);
        expect(validateToken(rawToken, hash)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it("generateToken produces unique tokens across runs", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const token1 = generateToken();
        const token2 = generateToken();
        expect(token1).not.toBe(token2);
      }),
      { numRuns: 100 },
    );
  });

  it("validateToken rejects wrong tokens — mismatched token and hash return false", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (tokenA, tokenB) => {
          fc.pre(tokenA !== tokenB);
          const hashA = hashToken(tokenA);
          expect(validateToken(tokenB, hashA)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});
