 'use client';
import type { ArtworkInspectionDetailDto } from '@/features/admin/types/moderation.types';
export function AiScanMetricsCard({ artwork }: { artwork: ArtworkInspectionDetailDto }) {
  const rows = [['Nội dung an toàn', artwork.safeScore], ['Nội dung người lớn', artwork.adultScore], ['Bạo lực', artwork.violenceScore]] as const;
  return <section className="space-y-2 text-sm text-slate-300"><h3 className="font-h1 font-semibold text-white">Chỉ số kiểm duyệt nội dung</h3>{rows.map(([label, value]) => <div key={label} className="flex justify-between"><span>{label}</span><span>{value == null ? 'Chưa có kết quả' : `${(value * 100).toFixed(1)}%`}</span></div>)}<p className="text-xs text-slate-400">Các chỉ số nội dung tách biệt với phát hiện ảnh AI.</p></section>;
}
