export function toPhotoUrl(filePath: string | undefined): string {
  if (!filePath) return '';
  const idx = filePath.indexOf('brain-data');
  const relative =
    idx >= 0
      ? filePath.slice(idx + 'brain-data'.length).replace(/^[/\\]+/, '')
      : filePath.replace(/^[/\\]+/, '');
  return `/brain-data/${relative}`;
}
