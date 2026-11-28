'use client';

/**
 * Bộ loader động dùng chung (kiểu uiverse.io/loaders) cho các trạng thái chờ.
 *
 * Chỉ dùng biến theme (`--lumen`, `--lumen-hi`, `--hair-2`) nên tự đổi màu ở dark mode.
 * Mọi animation đều tắt khi người dùng bật "giảm chuyển động" (xem gallery.css).
 */

type LoaderVariant = 'ring' | 'dots' | 'bar' | 'bars';
type LoaderSize = 'sm' | 'md' | 'lg';

const RING_PX: Record<LoaderSize, number> = { sm: 16, md: 28, lg: 44 };

/** Vòng cung quay + đầu tròn: dùng cho inline (nút, ô nhập) và khối chờ. */
export function RingLoader({ size = 'md', label }: { size?: LoaderSize; label?: string }) {
  const px = RING_PX[size];
  const stroke = size === 'sm' ? 2.2 : size === 'md' ? 2.6 : 3;
  return (
    <span className="loader-ring" role="status" aria-live="polite">
      <svg width={px} height={px} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="var(--hair-2)" strokeWidth={stroke} />
        <circle
          className="loader-ring__arc"
          cx="12"
          cy="12"
          r="9"
          stroke="var(--lumen)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray="42 100"
        />
      </svg>
      {label ? <span className={size === 'sm' ? 'sr-only' : 'loader-label'}>{label}</span> : null}
    </span>
  );
}

/** Ba chấm nhấp nhô — dùng cho khối chờ nhỏ hoặc giữa khung. */
export function DotsLoader({ label }: { label?: string }) {
  return (
    <span className="loader-dots" role="status" aria-live="polite">
      <i />
      <i />
      <i />
      {label ? <span className="loader-label">{label}</span> : null}
    </span>
  );
}

/** Năm thanh nhịp — nhìn rõ khi đặt giữa khung lớn. */
export function BarsLoader({ label }: { label?: string }) {
  return (
    <span className="loader-bars" role="status" aria-live="polite">
      <i />
      <i />
      <i />
      <i />
      <i />
      {label ? <span className="loader-label">{label}</span> : null}
    </span>
  );
}

/** Thanh chạy ngang mảnh — hợp đặt trên đầu khối nội dung đang tải. */
export function BarLoader({ label }: { label?: string }) {
  return (
    <span className="loader-bar" role="status" aria-live="polite">
      <i />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}

export function Loader({
  variant = 'ring',
  size = 'md',
  label,
}: {
  variant?: LoaderVariant;
  size?: LoaderSize;
  label?: string;
}) {
  if (variant === 'dots') return <DotsLoader label={label} />;
  if (variant === 'bars') return <BarsLoader label={label} />;
  if (variant === 'bar') return <BarLoader label={label} />;
  return <RingLoader size={size} label={label} />;
}

export { PencilLoader } from './pencil-loader';

/** Khối chờ giữa khung: loader + chữ, dùng thay cho "Đang tải…". */
export function LoadingBlock({ label = 'Đang tải…', variant = 'bars' }: { label?: string; variant?: LoaderVariant }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Loader variant={variant} size="lg" />
      <p className="text-sm text-[#6E6459]">{label}</p>
    </div>
  );
}

export default Loader;
