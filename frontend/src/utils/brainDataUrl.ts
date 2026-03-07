/**
 * Builds the public URL for a file (local brain-data or S3).
 * - s3:key → GET /brain/file?key=... (backend redirects to presigned S3 URL)
 * - local path → /brain-data/... (static assets or proxy)
 */
export function toBrainDataFileUrl(filePath: string | undefined): string {
  if (!filePath) return '';
  if (filePath.startsWith('s3:')) {
    return `/brain/file?key=${encodeURIComponent(filePath.slice(3))}`;
  }
  const idx = filePath.indexOf('brain-data');
  const relative =
    idx >= 0
      ? filePath.slice(idx + 'brain-data'.length).replace(/^[/\\]+/, '')
      : filePath.replace(/^[/\\]+/, '');
  return `/brain-data/${relative.replace(/\\/g, '/')}`;
}
