import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Wordmark } from '@/components/brand/wordmark';

export type StateAction = {
  label: string;
  /** Điều hướng bằng `Link`. Bỏ trống nếu dùng `onClick`. */
  href?: string;
  /** Hành động tại chỗ (retry, mở modal…). Chỉ dùng được từ client component. */
  onClick?: () => void;
  variant?: 'primary' | 'ghost';
};

interface StateScreenProps {
  icon: LucideIcon;
  /** Nhãn nhỏ phía trên tiêu đề: "404", "403", "Lỗi 500"… */
  code?: string;
  title: string;
  description?: React.ReactNode;
  actions?: StateAction[];
  /** Ghi chú nhỏ dưới nút, ví dụ mã lỗi để báo cho hỗ trợ. */
  footnote?: React.ReactNode;
  /** Hiện logo ở trên khung (dùng cho trang đứng một mình, không có header). */
  showBrand?: boolean;
  /** `false` khi đặt trong một khung đã có layout riêng (admin, workspace…). */
  fullPage?: boolean;
  children?: React.ReactNode;
}

const PRIMARY =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#B24A26] px-6 text-sm font-semibold text-[#FFFCF6] transition-colors hover:bg-[#8C3718] active:scale-[0.98]';
const GHOST =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#221E1A]/15 px-6 text-sm font-medium text-[#241F1A] transition-colors hover:border-[#B24A26]/45 hover:text-[#8C3718]';

/**
 * Khung báo trạng thái dùng chung: 404, 403, lỗi runtime, "cần đăng nhập", "chưa có dữ liệu".
 *
 * Một hình thức duy nhất cho mọi trang báo lỗi để người dùng không gặp ba kiểu thông báo
 * khác nhau ở ba chỗ khác nhau. Không dùng hook nên render được cả ở server component.
 */
export function StateScreen({
  icon: Icon,
  code,
  title,
  description,
  actions = [],
  footnote,
  showBrand = false,
  fullPage = true,
  children,
}: StateScreenProps) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center px-4 py-16 ${
        fullPage ? 'min-h-[calc(100vh-var(--nav-h,4.5rem))]' : ''
      }`}
    >
      {showBrand ? (
        <div className="mb-8">
          <Wordmark size="lg" />
        </div>
      ) : null}

      <div className="w-full max-w-lg rounded-2xl border border-[#221E1A]/10 bg-[#FFFCF6] px-6 py-10 text-center shadow-[0_30px_70px_-52px_rgba(74,52,30,0.9)] sm:px-10">
        <span className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-[#B24A26]/10 text-[#B24A26]">
          <Icon size={30} aria-hidden="true" />
        </span>

        {code ? (
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-[#8C7A63]">{code}</p>
        ) : null}

        <h1 className="mt-2 font-h1 text-2xl leading-tight text-[#241F1A] sm:text-[1.75rem]">{title}</h1>

        {description ? (
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#6E6459]">{description}</p>
        ) : null}

        {children}

        {actions.length > 0 ? (
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {actions.map((action) =>
              action.href ? (
                <Link
                  key={action.label}
                  href={action.href}
                  className={action.variant === 'ghost' ? GHOST : PRIMARY}
                >
                  {action.label}
                </Link>
              ) : (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className={action.variant === 'ghost' ? GHOST : PRIMARY}
                >
                  {action.label}
                </button>
              )
            )}
          </div>
        ) : null}

        {footnote ? <p className="mt-6 text-xs leading-5 text-[#8C7A63]">{footnote}</p> : null}
      </div>
    </div>
  );
}

export default StateScreen;
