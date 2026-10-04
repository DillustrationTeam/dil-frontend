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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1F2335] p-6 text-center">
        <p className="text-sm font-bold text-white">Trở thành Creator</p>
        <p className="mt-2 text-xs text-[#C7C5CF]">Tính năng này đang được hoàn thiện, quay lại sau nhé.</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 rounded-xl bg-[#A7ACD9] px-4 py-2 text-sm font-bold text-[#1F2335] transition hover:bg-white"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
