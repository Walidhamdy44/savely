import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as fc from "fast-check";
import { useDebounce } from "../use-debounce";

/**
 * Feature: clean-architecture-refactor, Property 1: useDebounce settles to input value
 *
 * For any input value of type string or number and any positive delay,
 * after the delay period elapses with no further changes, the debounced
 * value returned by useDebounce SHALL equal the most recently provided input value.
 *
 * **Validates: Requirements 3.4**
 */
describe("useDebounce - Property Tests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("Property 1: settles to input value for strings", () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.integer({ min: 1, max: 5000 }),
        (value, delay) => {
          const { result } = renderHook(() => useDebounce(value, delay));

          // Advance timers past the delay
          act(() => {
            vi.advanceTimersByTime(delay);
          });

          expect(result.current).toBe(value);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 1: settles to input value for numbers", () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: true }),
        fc.integer({ min: 1, max: 5000 }),
        (value, delay) => {
          const { result } = renderHook(() => useDebounce(value, delay));

          // Advance timers past the delay
          act(() => {
            vi.advanceTimersByTime(delay);
          });

          expect(result.current).toBe(value);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 1: settles to the most recently provided value after rerender", () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        fc.integer({ min: 1, max: 5000 }),
        (firstValue, secondValue, delay) => {
          const { result, rerender } = renderHook(
            ({ value, delay }: { value: string; delay: number }) =>
              useDebounce(value, delay),
            { initialProps: { value: firstValue, delay } },
          );

          // Rerender with a new value before the delay elapses
          act(() => {
            vi.advanceTimersByTime(Math.floor(delay / 2));
          });

          rerender({ value: secondValue, delay });

          // Advance past the full delay from the second update
          act(() => {
            vi.advanceTimersByTime(delay);
          });

          // Should settle to the most recent value
          expect(result.current).toBe(secondValue);
        },
      ),
      { numRuns: 100 },
    );
  });
});
