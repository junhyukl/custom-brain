import { toBrainDataFileUrl } from '../utils/brainDataUrl';

type OriginalFileLinkProps = {
  filePath: string;
  label?: string;
  className?: string;
};

const DEFAULT_LABEL = '원본 파일 열기';
const DEFAULT_CLASS = 'text-sm text-blue-400 hover:text-blue-300 underline';

export default function OriginalFileLink({
  filePath,
  label = DEFAULT_LABEL,
  className = DEFAULT_CLASS,
}: OriginalFileLinkProps) {
  const href = toBrainDataFileUrl(filePath);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {label}
    </a>
  );
}
