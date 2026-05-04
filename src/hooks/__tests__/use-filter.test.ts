import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as fc from "fast-check";
import { useFilter } from "../use-filter";

/**
 * Feature: clean-architecture-refactor, Property 3: useFilter URL round-trip
 *
 * For any valid filter value (string, enum member, or undefined), setting
 * the filter via `useFilter.setValue` and then reading it back SHALL return
 * a value equal to the original input. Clearing the filter SHALL remove
 * the corresponding URL search parameter.
 *
 * **Validates: Requirements 3.7, 7.2**
 */

// --- Mocks for next/navigation ---

/** Shared mutable state that simulates the URL search params. */
let mockParams: URLSearchParams;
let mockPathname: string;
let lastReplacedUrl: string;

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockParams,
  usePathname: () => mockPathname,
  useRouter: () => ({
    replace: (url: string) => {
      lastReplacedUrl = url;
      // Simulate the browser updating the URL: extract the query string
      // and update mockParams so the next render reads the new value.
      const qIndex = url.indexOf("?");
      mockParams = new URLSearchParams(
        qIndex >= 0 ? url.slice(qIndex + 1) : "",
      );
    },
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// --- Helpers ---

/** Reset shared mock state before each test. */
beforeEach(() => {
  mockParams = new URLSearchParams();
  mockPathname = "/dashboard";
  lastReplacedUrl = "";
});

// --- Property Tests ---

describe("useFilter - Property Tests", () => {
  it("Property 3: setValue(x) then reading value gives x for arbitrary strings", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        (key, filterValue) => {
          // Reset state for each iteration
          mockParams = new URLSearchParams();

          const { result, rerender } = renderHook(() => useFilter({ key }));

          // Set the filter value
          act(() => {
            result.current.setValue(filterValue);
          });

          // Re-render so the hook reads the updated mockParams
          rerender();

          // The value read back should equal the original input
          expect(result.current.value).toBe(filterValue);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 3: setValue(x) then reading value gives x for enum-like values", () => {
    const platformValues = [
      "youtube",
      "github",
      "manual",
      "linkedin",
      "instagram",
    ];

    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.constantFrom(...platformValues),
        (key, enumValue) => {
          mockParams = new URLSearchParams();

          const { result, rerender } = renderHook(() => useFilter({ key }));

          act(() => {
            result.current.setValue(enumValue);
          });

          rerender();

          expect(result.current.value).toBe(enumValue);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 3: clear() removes the URL search parameter", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        (key, filterValue) => {
          mockParams = new URLSearchParams();

          const { result, rerender } = renderHook(() => useFilter({ key }));

          // First set a value
          act(() => {
            result.current.setValue(filterValue);
          });
          rerender();

          // Confirm it was set
          expect(result.current.value).toBe(filterValue);

          // Now clear it
          act(() => {
            result.current.clear();
          });
          rerender();

          // After clearing, value should be undefined (no default)
          expect(result.current.value).toBeUndefined();

          // The URL should not contain the key
          expect(mockParams.has(key)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 3: clear() falls back to defaultValue when provided", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (key, filterValue, defaultValue) => {
          mockParams = new URLSearchParams();

          const { result, rerender } = renderHook(() =>
            useFilter({ key, defaultValue }),
          );

          // Set a value
          act(() => {
            result.current.setValue(filterValue);
          });
          rerender();

          expect(result.current.value).toBe(filterValue);

          // Clear it — should fall back to defaultValue
          act(() => {
            result.current.clear();
          });
          rerender();

          expect(result.current.value).toBe(defaultValue);
          // The URL param itself should be removed
          expect(mockParams.has(key)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 3: value is defaultValue when no URL param is present", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (key, defaultValue) => {
          mockParams = new URLSearchParams();

          const { result } = renderHook(() => useFilter({ key, defaultValue }));

          expect(result.current.value).toBe(defaultValue);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 3: value is undefined when no URL param and no default", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (key) => {
        mockParams = new URLSearchParams();

        const { result } = renderHook(() => useFilter({ key }));

        expect(result.current.value).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });
});
