"use client";

import { useState, useEffect } from "react";

/**
 * Delays updating a value until a specified period of inactivity.
 * Useful for search inputs to avoid firing requests on every keystroke.
 *
 * @param value - The input value to debounce
 * @param delay - Delay in milliseconds before the value settles
 * @returns The debounced value, updated only after `delay` ms of no changes
 *
 * **Validates: Requirements 3.4**
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
