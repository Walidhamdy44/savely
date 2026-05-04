import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as fc from "fast-check";
import { usePagination } from "../use-pagination";

/**
 * Feature: clean-architecture-refactor, Property 2: usePagination cursor consistency
 *
 * For any sequence of `fetchNextPage` calls on a paginated result set,
 * the cursor state SHALL advance monotonically (each cursor is different
 * from the previous), and calling `reset` SHALL return the cursor to
 * `undefined` (the initial state).
 *
 * **Validates: Requirements 3.5**
 */
describe("usePagination - Property Tests", () => {
  it("Property 2: cursor starts as undefined", () => {
    const { result } = renderHook(() => usePagination());
    expect(result.current.cursor).toBeUndefined();
  });

  it("Property 2: each setCursor call advances to a different cursor than the previous", () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.string({ minLength: 1 }), {
          minLength: 2,
          maxLength: 20,
        }),
        (cursors) => {
          const { result } = renderHook(() => usePagination());

          // Cursor starts as undefined
          expect(result.current.cursor).toBeUndefined();

          let previousCursor: string | undefined = undefined;

          for (const nextCursor of cursors) {
            act(() => {
              result.current.setCursor(nextCursor);
            });

            // Each new cursor is different from the previous one
            expect(result.current.cursor).not.toBe(previousCursor);
            // The cursor matches what we set
            expect(result.current.cursor).toBe(nextCursor);

            previousCursor = result.current.cursor;
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 2: reset returns cursor to undefined after any sequence of setCursor calls", () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 20 }),
        (cursors) => {
          const { result } = renderHook(() => usePagination());

          // Apply a sequence of cursor advances
          for (const nextCursor of cursors) {
            act(() => {
              result.current.setCursor(nextCursor);
            });
          }

          // Cursor should be at the last value
          expect(result.current.cursor).toBe(cursors[cursors.length - 1]);

          // Reset should return cursor to undefined
          act(() => {
            result.current.reset();
          });

          expect(result.current.cursor).toBeUndefined();
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 2: reset also clears hasNextPage", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (cursor) => {
        const { result } = renderHook(() => usePagination());

        // Set some state
        act(() => {
          result.current.setCursor(cursor);
          result.current.setHasNextPage(true);
        });

        expect(result.current.cursor).toBe(cursor);
        expect(result.current.hasNextPage).toBe(true);

        // Reset clears everything
        act(() => {
          result.current.reset();
        });

        expect(result.current.cursor).toBeUndefined();
        expect(result.current.hasNextPage).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});
