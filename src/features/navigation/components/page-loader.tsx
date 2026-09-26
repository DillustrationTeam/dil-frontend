/**
 * Bộ loader dùng chung cho các màn hình đang chờ dữ liệu.
 *
 * Dựng lại theo element "blue-dragon-70" của Nawsome trên uiverse.io
 * (MIT License) — mô tả: nền tối, ô vuông trắng, tối giản, canh giữa,
 * xoay tròn, lưới ô vuông. Lưới 3×3 xoay liên tục, từng ô nhấp nháy lệch pha
 * theo đường chéo để tạo cảm giác chuyển động chạy qua lưới.
 *
 * CSS để trong <style> ngay trong component nên không phải đụng tới globals.css
 * (file dùng chung của cả dự án).
 */

const STYLE = `
@keyframes dil-grid-rotate {
  0%   { transform: rotate(0deg); }
  50%  { transform: rotate(180deg); }
  100% { transform: rotate(360deg); }
}
@keyframes dil-cell-pulse {
  0%, 100% { opacity: 0.15; transform: scale(0.6); }
  50%      { opacity: 1;    transform: scale(1); }
}
.dil-loader-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  animation: dil-grid-rotate 2.4s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
.dil-loader-cell {
  background: currentColor;
  border-radius: 2px;
  animation: dil-cell-pulse 1.2s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .dil-loader-grid { animation: none; }
  .dil-loader-cell { animation: none; opacity: 0.7; transform: none; }
}
`;

/** Chín ô, độ trễ tăng dần theo đường chéo để sóng chạy từ góc trên trái xuống. */
function Grid({ size }: { size: number }) {
  const gap = Math.max(3, Math.round(size * 0.09));
  return (
    <span
      className="dil-loader-grid text-brand-periwinkle"
      style={{ width: size, height: size, gap }}
      aria-hidden
    >
      {Array.from({ length: 9 }).map((_, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        return (
          <span
            key={index}
            className="dil-loader-cell"
            style={{ animationDelay: `${(row + col) * 0.1}s` }}
          />
        );
      })}
    </span>
  );
}

/**
 * Loader chiếm trọn vùng nội dung — dùng khi cả màn hình đang chờ dữ liệu.
 * `label` là câu tiếng Việt mô tả đang chờ gì.
 */
export function PageLoader({
  label = 'Đang tải dữ liệu…',
  size = 52,
  className = '',
}: {
  label?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 py-12 ${className}`} role="status" aria-live="polite">
      <style>{STYLE}</style>
      <Grid size={size} />
      <p className="text-xs text-outline">{label}</p>
    </div>
  );
}

/** Loader nhỏ dùng trong nút hoặc cạnh dòng chữ ngắn. */
export function InlineLoader({
  label,
  size = 18,
  className = '',
}: {
  label?: string;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role="status" aria-live="polite">
      <style>{STYLE}</style>
      <Grid size={size} />
      {label && <span>{label}</span>}
    </span>
  );
}
