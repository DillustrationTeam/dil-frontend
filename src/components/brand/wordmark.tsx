import Link from 'next/link';

/**
 * Logo chữ dùng chung cho mọi header/modal: serif italic + chấm son.
 * Thay cho các file bitmap (weblogo.png / studiologo.png) vốn vẽ cho nền navy nên
 * nhoè khi đặt trên giấy.
 */
export function Wordmark({
  size = 'md',
  href = '/',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  href?: string | null;
  className?: string;
}) {
  const scale = size === 'lg' ? '1.6rem' : size === 'sm' ? '1.05rem' : '1.25rem';
  const content = (
    <span className={`wordmark inline-flex items-center ${className}`.trim()}>
      <span className="wordmark__text" style={{ fontSize: scale }}>
        dilillustration
      </span>
      <span className="wordmark-dot" aria-hidden="true" />
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} aria-label="dillustration — trang chủ" className="inline-flex items-center">
      {content}
    </Link>
  );
}

export default Wordmark;
