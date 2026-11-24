'use client';

interface BecomeCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Placeholder tạm thời — component thật bị thiếu khi push lên `develop` (import đã có,
 * file chưa từng được add). Thay bằng bản thật khi đồng đội push lại; props (isOpen/onClose)
 * khớp đúng với cách `(public)/layout.tsx` đang gọi.
 */
export function BecomeCreatorModal({ isOpen, onClose }: BecomeCreatorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#E5D8C2] p-4">
      <div className="w-full max-w-md rounded-3xl border border-[#221E1A]/10 bg-[#F7F2E9] p-6 text-center">
        <p className="text-sm font-bold text-[#241F1A]">Trở thành họa sĩ</p>
        <p className="mt-2 text-xs text-[#6E6459]">Tính năng này đang được hoàn thiện, quay lại sau nhé.</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 rounded-xl bg-[#B24A26] px-4 py-2 text-sm font-bold text-[#F7F2E9] transition hover:bg-[#F0E7D8]"
        > Đóng </button>
      </div>
    </div>
  );
}
