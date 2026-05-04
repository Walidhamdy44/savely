/**
 * Mapping of tRPC error codes to user-friendly messages.
 */
const ERROR_CODE_MAP: Record<string, string> = {
  UNAUTHORIZED: "Please sign in to continue.",
  NOT_FOUND: "The requested item could not be found.",
  FORBIDDEN: "You don't have permission to do that.",
  BAD_REQUEST: "The request was invalid. Please check your input.",
  TOO_MANY_REQUESTS: "Too many requests. Please wait a moment.",
  INTERNAL_SERVER_ERROR: "Something went wrong. Please try again.",
  PRECONDITION_FAILED: "A required condition was not met.",
};

/**
 * Maps a tRPC error code to a user-friendly message.
 *
 * @param code - The tRPC error code string (e.g., "UNAUTHORIZED", "NOT_FOUND")
 * @returns A user-friendly error message string
 */
export function mapTRPCErrorToMessage(code: string): string {
  return ERROR_CODE_MAP[code] ?? "An unexpected error occurred.";
}
