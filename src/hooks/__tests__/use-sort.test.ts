import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as fc from "fast-check";
import { useSort } from "../use-sort";

/**
 * Feature: clean-architecture-refactor, Property 4: useSort toggle cycling
 *
 * For any column name, toggling sort on that column SHALL cycle through
 * the states asc → desc → none in order. Toggling sort on a different
 * column SHALL reset the previous column and start the new column at asc.
 *
 * **Validates: Requirements 3.8**
 */
describe("useSort - Property Tests", () => {
  it("Property 4: toggle(col) cycles asc → desc → none for any column", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 30 }), (col) => {
        const { result } = renderHook(() => useSort());

        // Initially no sort is active
        expect(result.current.column).toBeUndefined();
        expect(result.current.direction).toBeUndefined();

        // First toggle → asc
        act(() => {
          result.current.toggle(col);
        });
        expect(result.current.column).toBe(col);
        expect(result.current.direction).toBe("asc");

        // Second toggle → desc
        act(() => {
          result.current.toggle(col);
        });
        expect(result.current.column).toBe(col);
        expect(result.current.direction).toBe("desc");

        // Third toggle → none (column and direction cleared)
        act(() => {
          result.current.toggle(col);
        });
        expect(result.current.column).toBeUndefined();
        expect(result.current.direction).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });

  it("Property 4: toggle(differentCol) resets to asc on the new column", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        (colA, colB) => {
          // Ensure the two columns are different
          fc.pre(colA !== colB);

          const { result } = renderHook(() => useSort());

          // Activate sort on colA → asc
          act(() => {
            result.current.toggle(colA);
          });
          expect(result.current.column).toBe(colA);
          expect(result.current.direction).toBe("asc");

          // Toggle colA again → desc
          act(() => {
            result.current.toggle(colA);
          });
          expect(result.current.column).toBe(colA);
          expect(result.current.direction).toBe("desc");

          // Now toggle a different column → resets to asc on colB
          act(() => {
            result.current.toggle(colB);
          });
          expect(result.current.column).toBe(colB);
          expect(result.current.direction).toBe("asc");
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 4: toggle(differentCol) resets from any cycle state", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.integer({ min: 1, max: 3 }),
        (colA, colB, toggleCount) => {
          fc.pre(colA !== colB);

          const { result } = renderHook(() => useSort());

          // Toggle colA a variable number of times (1–3) to reach different states
          for (let i = 0; i < toggleCount; i++) {
            act(() => {
              result.current.toggle(colA);
            });
          }

          // Now switch to colB — should always start at asc
          act(() => {
            result.current.toggle(colB);
          });
          expect(result.current.column).toBe(colB);
          expect(result.current.direction).toBe("asc");
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 4: reset returns to default state", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.integer({ min: 1, max: 5 }),
        (col, toggleCount) => {
          const { result } = renderHook(() => useSort());

          // Toggle some number of times
          for (let i = 0; i < toggleCount; i++) {
            act(() => {
              result.current.toggle(col);
            });
          }

          // Reset should return to initial defaults (no column, no direction)
          act(() => {
            result.current.reset();
          });
          expect(result.current.column).toBeUndefined();
          expect(result.current.direction).toBeUndefined();
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 4: reset returns to provided defaults when configured", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.constantFrom("asc" as const, "desc" as const),
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.integer({ min: 1, max: 5 }),
        (defaultCol, defaultDir, otherCol, toggleCount) => {
          const { result } = renderHook(() =>
            useSort({
              defaultColumn: defaultCol,
              defaultDirection: defaultDir,
            }),
          );

          // Toggle some number of times on a different column
          for (let i = 0; i < toggleCount; i++) {
            act(() => {
              result.current.toggle(otherCol);
            });
          }

          // Reset should restore the configured defaults
          act(() => {
            result.current.reset();
          });
          expect(result.current.column).toBe(defaultCol);
          expect(result.current.direction).toBe(defaultDir);
        },
      ),
      { numRuns: 100 },
    );
  });
});
