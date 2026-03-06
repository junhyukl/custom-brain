/** Extract file name from a path (handles both / and \). */
export function getFileName(filePath: string | undefined, fallback = ''): string {
  if (filePath == null || filePath === '') return fallback;
  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1] ?? fallback;
}
