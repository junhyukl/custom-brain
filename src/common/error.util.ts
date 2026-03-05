/**
 * Normalize unknown caught errors to a string message for API responses and logging.
 */
export function toErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
