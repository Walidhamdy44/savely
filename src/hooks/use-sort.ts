"use client";

import { useState, useCallback } from "react";

/** Sort direction values that the toggle cycles through. */
type SortDirection = "asc" | "desc" | undefined;

/** Options for configuring the sort hook. */
interface UseSortOptions {
  /** Column to sort by initially. Defaults to undefined (no sort). */
  defaultColumn?: string;
  /** Initial sort direction. Defaults to undefined (no sort). */
  defaultDirection?: SortDirection;
}

/** Return value of the useSort hook. */
interface UseSortReturn {
  /** The currently sorted column, or undefined if no sort is active. */
  column: string | undefined;
  /** The current sort direction, or undefined when sort is inactive. */
  direction: SortDirection;
  /** Toggle sort on a column: asc → desc → none. A new column starts at asc. */
  toggle: (col: string) => void;
  /** Reset sort to the initial defaults. */
  reset: () => void;
}

/**
 * Manages sort state with toggle cycling (asc → desc → none) and
 * multi-column support. Toggling a different column resets the
 * previous column and starts at ascending.
 *
 * @param options - Optional default column and direction
 * @returns Current sort state and control functions
 *
 * **Validates: Requirements 3.8**
 */
export function useSort(options?: UseSortOptions): UseSortReturn {
  const { defaultColumn, defaultDirection } = options ?? {};
  const [column, setColumn] = useState<string | undefined>(defaultColumn);
  const [direction, setDirection] = useState<SortDirection>(defaultDirection);

  const toggle = useCallback(
    (col: string) => {
      if (col !== column) {
        setColumn(col);
        setDirection("asc");
        return;
      }
      if (direction === "asc") {
        setDirection("desc");
      } else if (direction === "desc") {
        setColumn(undefined);
        setDirection(undefined);
      } else {
        setDirection("asc");
      }
    },
    [column, direction],
  );

  const reset = useCallback(() => {
    setColumn(defaultColumn);
    setDirection(defaultDirection);
  }, [defaultColumn, defaultDirection]);

  return { column, direction, toggle, reset };
}
