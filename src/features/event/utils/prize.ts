import type { EventDetailDto } from '../types/event.types';

/**
 * Một dòng giải thưởng đã tách khỏi chuỗi `prize` của backend.
 * Backend trả về một câu dài, ví dụ:
 *   "Giải Nhất 15.000.000đ · Giải Nhì 8.000.000đ · Giải Ba 3.000.000đ"
 * → tách theo dấu `·` / `;` / xuống dòng, rồi tách số tiền nằm ở CUỐI mỗi mẩu.
 */
export interface PrizeTier {
  /** Nhãn: "Giải Nhất", "5 giải Khuyến khích mỗi giải"… */
  label: string;
  /** Số tiền đã gồm đơn vị: "15.000.000đ"; null nếu mẩu không có số tiền */
  amount: string | null;
}

const SEPARATOR = /\s*[·•|;\n]\s*|(?<=(?:vnđ|vnd|đ))\s*,\s*/i;
/** Số tiền đứng ở CUỐI mẩu (tránh cắt câu "30.000.000đ + buổi trưng bày"). */
const TRAILING_AMOUNT = /^(.*?)[\s,–-]*([\d][\d.,]*\s*(?:vnđ|vnd|đ|d))\s*$/i;
/** Mọi số tiền trong mẩu */
const ANY_AMOUNT = /[\d][\d.,]*\s*(?:vnđ|vnd|đ)/gi;

function splitPart(part: string): PrizeTier {
  const trailing = part.match(TRAILING_AMOUNT);
  if (trailing) {
    const label = trailing[1].trim();
    return { label: label || part, amount: trailing[2].trim() };
  }

  // Mẩu kiểu "Giải Nhất 20.000.000đ + hợp đồng độc quyền 6 tháng":
  // chỉ có một số tiền → vẫn tách số tiền ra, phần còn lại làm nhãn.
  const amounts = [...part.matchAll(ANY_AMOUNT)];
  if (amounts.length === 1) {
    const label = part
      .replace(amounts[0][0], ' ')
      .replace(/\s*\+\s*$/, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return { label: label || part, amount: amounts[0][0].trim() };
  }

  return { label: part, amount: null };
}

export function parsePrizeTiers(prize?: string | null): PrizeTier[] {
  if (!prize) return [];

  return prize
    .split(SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean)
    .map(splitPart);
}

export type PrizeSource = Pick<EventDetailDto, 'prize'>;
