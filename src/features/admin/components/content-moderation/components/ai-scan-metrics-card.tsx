'use client';
import type { ArtworkInspectionDetailDto } from '@/features/admin/types/moderation.types';
import { useLanguage } from '@/context/language-context';

export function AiScanMetricsCard({ artwork }: { artwork: ArtworkInspectionDetailDto }) {
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
  const rows = [
    [isVie ? 'Nội dung an toàn' : 'Safe Content', artwork.safeScore],
    [isVie ? 'Nội dung người lớn' : 'Adult Content', artwork.adultScore],
    [isVie ? 'Bạo lực' : 'Violence', artwork.violenceScore],
  ] as const;
  return (
    <section className="space-y-2 text-sm text-[#746A5F]">
      <h3 className="font-h1 font-semibold text-[#241F1A]">
        {isVie ? 'Chỉ số kiểm duyệt nội dung' : 'Content Moderation Scores'}
      </h3>
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between">
          <span>{label}</span>
          <span>{value == null ? (isVie ? 'Chưa có kết quả' : 'No result yet') : `${(value * 100).toFixed(1)}%`}</span>
        </div>
      ))}
      <p className="text-xs text-[#746A5F]">
        {isVie
          ? 'Các chỉ số nội dung tách biệt với phát hiện ảnh AI.'
          : 'Content moderation scores separate from AI image detection.'}
      </p>
    </section>
  );
}
