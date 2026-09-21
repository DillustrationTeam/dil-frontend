'use client';

import { useMemo } from 'react';
import type { RevenuePointDto } from '../types/payment.types';

const CHART_WIDTH = 720;
const CHART_HEIGHT = 240;
const PADDING = { top: 16, right: 16, bottom: 30, left: 58 };

/** Nhãn trục tung rút gọn — đủ để đọc xu hướng, chi tiết xem ở tooltip từng điểm. */
function formatAxisValue(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} tr`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(Math.round(value));
}

function formatFullVnd(value: number) {
  return `${Math.round(value).toLocaleString('vi-VN')} ₫`;
}

/**
 * Biểu đồ vùng + đường cho doanh thu ròng theo thời gian (SCR-51).
 *
 * VÌ SAO vẽ SVG trực tiếp thay vì thêm thư viện chart: repo chưa có thư viện biểu đồ,
 * thêm dependency chỉ để vẽ một chuỗi thời gian là cái giá không cần thiết. SVG nội tuyến
 * giữ được đúng bảng màu Digital Etherealism, nhẹ, không phát sinh bundle mới.
 */
export function RevenueChart({ points }: { points: RevenuePointDto[] }) {
  const geometry = useMemo(() => {
    const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
    const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
    const maxValue = Math.max(1, ...points.map((p) => p.netAmount));
    const stepX = points.length > 1 ? innerWidth / (points.length - 1) : 0;

    const coords = points.map((point, index) => ({
      point,
      x: PADDING.left + (points.length > 1 ? index * stepX : innerWidth / 2),
      y: PADDING.top + innerHeight - (point.netAmount / maxValue) * innerHeight,
    }));

    const baseline = PADDING.top + innerHeight;
    const linePath = coords
      .map((coord, index) => `${index === 0 ? 'M' : 'L'}${coord.x.toFixed(1)},${coord.y.toFixed(1)}`)
      .join(' ');

    const first = coords[0];
    const last = coords[coords.length - 1];
    const areaPath = first && last
      ? `${linePath} L${last.x.toFixed(1)},${baseline.toFixed(1)} L${first.x.toFixed(1)},${baseline.toFixed(1)} Z`
      : '';

    const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
      ratio,
      value: maxValue * ratio,
      y: PADDING.top + innerHeight - ratio * innerHeight,
    }));

    // Nhãn trục hoành thưa dần để không chồng chữ khi có nhiều mốc.
    const labelStep = Math.max(1, Math.ceil(points.length / 8));

    return { innerWidth, innerHeight, coords, linePath, areaPath, ticks, labelStep, baseline };
  }, [points]);

  if (points.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-outline">
        Chưa có dữ liệu giao dịch trong khoảng thời gian này.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-label="Biểu đồ doanh thu ròng theo thời gian"
        className="h-60 w-full min-w-[520px]"
      >
        <defs>
          <linearGradient id="revenue-net-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A7ACD9" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#A7ACD9" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Lưới ngang + nhãn trục tung */}
        {geometry.ticks.map((tick) => (
          <g key={tick.ratio}>
            <line
              x1={PADDING.left}
              y1={tick.y}
              x2={CHART_WIDTH - PADDING.right}
              y2={tick.y}
              stroke="#919099"
              strokeOpacity="0.18"
              strokeDasharray={tick.ratio === 0 ? undefined : '3 5'}
            />
            <text x={PADDING.left - 10} y={tick.y + 3} textAnchor="end" fontSize="10" fill="#919099">
              {formatAxisValue(tick.value)}
            </text>
          </g>
        ))}

        <path d={geometry.areaPath} fill="url(#revenue-net-area)" />
        <path
          d={geometry.linePath}
          fill="none"
          stroke="#A7ACD9"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {geometry.coords.map((coord, index) => (
          <g key={`${coord.point.periodLabel}-${index}`}>
            <circle cx={coord.x} cy={coord.y} r="3" fill="#1F2335" stroke="#A7ACD9" strokeWidth="2">
              <title>
                {`${coord.point.periodLabel}: ròng ${formatFullVnd(coord.point.netAmount)} · gộp ${formatFullVnd(coord.point.grossAmount)} · phí ${formatFullVnd(coord.point.feeAmount)}`}
              </title>
            </circle>
            {index % geometry.labelStep === 0 && (
              <text x={coord.x} y={geometry.baseline + 18} textAnchor="middle" fontSize="10" fill="#919099">
                {coord.point.periodLabel}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
