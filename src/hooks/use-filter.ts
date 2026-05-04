"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

/** Options for configuring the filter hook. */
interface UseFilterOptions {
  /** The URL search parameter key to sync with. */
  key: string;
  /** Default value when the parameter is absent. Defaults to undefined. */
  defaultValue?: string;
}

/** Return value of the useFilter hook. */
interface UseFilterReturn {
  /** The current filter value, or the default if the URL param is absent. */
  value: string | undefined;
  /** Set the filter value and update the URL search parameter. */
  setValue: (next: string) => void;
  /** Clear the filter, removing the URL search parameter. */
  clear: () => void;
}

/**
 * Manages a single filter value synced with a URL search parameter.
 * Reading and writing go through `useSearchParams` so the filter
 * survives page refreshes and can be shared via URL.
 *
 * @param options - The parameter key and optional default value
 * @returns Current value, a setter, and a clear function
 *
 * **Validates: Requirements 3.7, 7.2**
 */
export function useFilter(options: UseFilterOptions): UseFilterReturn {
  const { key, defaultValue } = options;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const value = searchParams.get(key) ?? defaultValue;

  const updateParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      updater(params);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname],
  );

  const setValue = useCallback(
    (next: string) => {
      updateParams((params) => params.set(key, next));
    },
    [key, updateParams],
  );

  const clear = useCallback(() => {
    updateParams((params) => params.delete(key));
  }, [key, updateParams]);

  return { value, setValue, clear };
}
