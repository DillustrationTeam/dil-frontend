'use client';

import { useState } from 'react';
import { AlertTriangle, ChevronDown, MapPin, ShieldCheck } from 'lucide-react';

/**
 * Thang cảnh báo 5 mức cho người bán — câu chữ viết cho NGƯỜI BÁN đọc, không dùng
 * thuật ngữ nội bộ (ký quỹ, giải ngân, phụ phí, phí nền tảng). Mỗi mức nói rõ:
 *   1. "Bạn sẽ bị gì"  -> hậu quả cụ thể, có ví dụ số tiền
 *   2. "Khi nào bị"    -> trường hợp nào dẫn tới mức đó
 *
 * Mặc định THU GỌN: chỉ hiện một dòng link ở chân form giao hàng; bấm mới bung bảng.
 *
 * Hai đường vào thang phạt (đúng như backend `AuctionPenaltyService`):
 *   - tiền bán tranh còn ở sàn (người mua được trả lại) -> mỗi lần bị xác nhận lên 1 mức
 *   - tiền đã về ví người bán                            -> mỗi lần bị xác nhận lên 2 mức
 * Công thức: step = min(5, số_lần_đã_bị_xác_nhận + 1 + (tiền_đã_về_ví ? 2 : 0)).
 *
 * Ví dụ tiền: phí sàn 10% -> bán 1.000.000đ người bán nhận 900.000đ.
 *   mức 3 (trừ 30%) -> nhận 700.000đ; mức 4 (trừ 50%) -> nhận 500.000đ.
 */
const LEVELS: { step: number; title: string; consequence: string; when: string }[] = [
  {
    step: 1,
    title: 'Mức 1',
    consequence: 'Chỉ bị nhắc nhở, bạn không mất tiền và vẫn bán bình thường.',
    when: 'Lần đầu bị xác nhận, khi tiền bán tranh còn ở sàn (người mua được trả lại tiền).',
  },
  {
    step: 2,
    title: 'Mức 2',
    consequence: 'Bị nhắc nhở và không được đăng bán tranh trong 1 ngày.',
    when: 'Lần thứ 2, khi tiền bán tranh vẫn còn ở sàn.',
  },
  {
    step: 3,
    title: 'Mức 3',
    consequence:
      '5 phiên bán tiếp theo bị trừ thêm 20%: bán 1.000.000đ bạn nhận 700.000đ thay vì 900.000đ.',
    when: 'Lần thứ 3 khi tiền còn ở sàn. Hoặc lần đầu tiên khi tiền đã về ví bạn.',
  },
  {
    step: 4,
    title: 'Mức 4',
    consequence:
      '5 phiên bán tiếp theo bị trừ thêm 40%: bán 1.000.000đ bạn nhận 500.000đ. Đồng thời không được đăng bán 7 ngày.',
    when: 'Lần thứ 4 khi tiền còn ở sàn. Hoặc lần thứ 2 khi tiền đã về ví bạn.',
  },
  {
    step: 5,
    title: 'Mức 5',
    consequence: 'Không được đăng bán tranh nữa, vĩnh viễn.',
    when: 'Lần thứ 5 khi tiền còn ở sàn. Hoặc lần thứ 3 khi tiền đã về ví bạn.',
  },
];

interface SellerPenaltyLadderProps {
  /** Mức phạt hiện tại của người bán (0 = chưa bị phạt). */
  level: number;
}

export function SellerPenaltyLadder({ level }: SellerPenaltyLadderProps) {
  const [open, setOpen] = useState(false);
  const current = Math.min(Math.max(level, 0), 5);

  return (
    <div className="rounded-xl border border-white/12 bg-black/20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="seller-penalty-ladder"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] hover:bg-white/5 transition rounded-xl"
      >
        <ShieldCheck size={13} className="shrink-0 text-brand-periwinkle" />
        <span className="flex-1 whitespace-nowrap text-brand-periwinkle underline underline-offset-2">
          Xem mức phạt khi bị khiếu nại
        </span>
        {current > 0 && (
          <span className="shrink-0 rounded-md bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 whitespace-nowrap">
            {`Bạn đang ở mức ${current}/5`}
          </span>
        )}
        <ChevronDown
          size={14}
          className={`shrink-0 text-outline transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div id="seller-penalty-ladder" className="space-y-2 border-t border-white/10 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={13} className="shrink-0 mt-0.5 text-amber-300" />
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-white">Bị phạt thế nào nếu người mua khiếu nại đúng?</p>
              <p className="text-[10px] leading-relaxed text-outline">
                Ban quản trị xác nhận người mua đúng thì bạn bị tính một mức phạt. Mức phạt chỉ tăng, không giảm. Tiền
                bán tranh còn ở sàn: mỗi lần bị xác nhận bạn lên 1 mức. Tiền đã về ví bạn: mỗi lần bị xác nhận bạn lên 2
                mức.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-white/10">
            <table className="w-full border-collapse text-left text-[11px]">
              <thead>
                <tr className="bg-white/5 text-[10px] uppercase tracking-wide text-outline">
                  <th className="w-16 px-2 py-1.5 font-semibold">Mức</th>
                  <th className="px-2 py-1.5 font-semibold">Bạn sẽ bị gì</th>
                </tr>
              </thead>
              <tbody>
                {LEVELS.map((row) => {
                  const isCurrent = row.step === current && current > 0;
                  return (
                    <tr
                      key={row.step}
                      aria-current={isCurrent ? 'step' : undefined}
                      className={
                        isCurrent
                          ? 'border-t border-amber-400/40 bg-amber-400/15 text-amber-100'
                          : 'border-t border-white/8 text-outline'
                      }
                    >
                      <td className="px-2 py-1.5 align-top">
                        <span className={isCurrent ? 'font-bold text-amber-300' : 'font-semibold text-white/80'}>
                          {row.title}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 align-top">
                        <span className={`block ${isCurrent ? 'font-semibold text-amber-100' : ''}`}>
                          {row.consequence}
                        </span>
                        <span
                          className={`mt-0.5 block text-[10px] leading-relaxed ${
                            isCurrent ? 'text-amber-200/90' : 'text-outline/80'
                          }`}
                        >
                          {row.when}
                        </span>
                        {isCurrent && (
                          <span className="mt-1 inline-flex items-center gap-0.5 rounded-md bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-brand-navy whitespace-nowrap">
                            <MapPin size={9} className="shrink-0" />
                            (Bạn đang ở đây)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-[10px] text-outline">
            {current === 0
              ? 'Bạn chưa bị mức phạt nào.'
              : 'Giao hàng đúng mô tả và giữ biên lai bưu cục để không bị nâng mức.'}
          </p>
        </div>
      )}
    </div>
  );
}
