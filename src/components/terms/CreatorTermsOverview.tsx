'use client';

import { Ban, Check, FilePlus2, Lock, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import type {
  CreatorCustomClauseDto,
  CreatorExtendedTermsDto,
  CreatorTermsDto,
} from '@/features/creator-studio/types/creator-profile.types';

export const DEFAULT_EXTENDED_TERMS: CreatorExtendedTermsDto = {
  version: 1,
  willDraw: 'Nhân vật gốc (OC), fanart anime/game, minh họa chân dung, couple.',
  wontDraw: 'Nội dung 18+/NSFW, thù hận/chính trị, mecha quá phức tạp.',
  commercialScope:
    'Sử dụng trên kênh livestream, YouTube, banner quảng bá, hoặc in ấn lưu niệm theo thỏa thuận thương mại.',
  usageRestrictions:
    'Không chỉnh sửa làm biến dạng tác phẩm gốc khi chưa trao đổi. Tệp nguồn phân lớp (.PSD/.CLIP) chỉ bàn giao nếu có thỏa thuận riêng.',
  allowPortfolioDisplay: true,
  requireCredit: true,
  prohibitAiTraining: true,
  prohibitResale: true,
  customClauses: [],
};

export const CREATOR_TERMS_PRESETS: Array<{
  id: string;
  label: string;
  description: string;
  terms: CreatorTermsDto;
}> = [
  {
    id: 'standard',
    label: 'Mẫu ToS tiêu chuẩn',
    description: 'Cân bằng quyền lợi cho commission cá nhân & thương mại phổ biến.',
    terms: {
      commercialLicenseMultiplier: 1.5,
      extended: { ...DEFAULT_EXTENDED_TERMS, customClauses: [] },
    },
  },
  {
    id: 'strict-commercial',
    label: 'Mẫu thương mại chặt chẽ',
    description: 'Phù hợp tác phẩm branding/VTuber: siết quyền bán lại, bảo vệ bản quyền cao.',
    terms: {
      commercialLicenseMultiplier: 2.0,
      extended: {
        ...DEFAULT_EXTENDED_TERMS,
        commercialScope:
          'Bao gồm phát sóng livestream, thumbnail, merch in ấn và ấn phẩm truyền thông thương hiệu của chính Client.',
        usageRestrictions:
          'Không chuyển nhượng hoặc bán lại tệp gốc cho bên thứ ba. Mọi yêu cầu giữ kín hoàn toàn (NDA) cần thống nhất trước khi ký quỹ.',
        allowPortfolioDisplay: true,
        requireCredit: true,
        prohibitAiTraining: true,
        prohibitResale: true,
        customClauses: [
          {
            title: 'Phí chỉnh sửa phát sinh',
            content: 'Từ lần chỉnh sửa phát sinh sau khi vượt giới hạn miễn phí của mốc sẽ áp dụng phụ phí theo độ phức tạp.',
          },
        ],
      },
    },
  },
];

const orDefault = (value: string | null | undefined, fallback: string): string =>
  value && value.trim().length > 0 ? value.trim() : fallback;

export function normalizeCreatorTerms(terms?: CreatorTermsDto | null): {
  commercialLicenseMultiplier: number;
  extended: CreatorExtendedTermsDto;
  updatedAt?: string | null;
} {
  const customClauses: CreatorCustomClauseDto[] = Array.isArray(terms?.extended?.customClauses)
    ? terms!.extended!.customClauses
        .filter((c) => Boolean(c?.title?.trim() || c?.content?.trim()))
        .map((c) => ({
          title: orDefault(c.title, 'Điều khoản bổ sung'),
          content: c.content?.trim() ?? '',
        }))
    : [];

  return {
    commercialLicenseMultiplier: terms?.commercialLicenseMultiplier ?? 1.5,
    extended: {
      version: terms?.extended?.version ?? 1,
      willDraw: orDefault(terms?.extended?.willDraw, DEFAULT_EXTENDED_TERMS.willDraw!),
      wontDraw: orDefault(terms?.extended?.wontDraw, DEFAULT_EXTENDED_TERMS.wontDraw!),
      commercialScope: orDefault(terms?.extended?.commercialScope, DEFAULT_EXTENDED_TERMS.commercialScope!),
      usageRestrictions: orDefault(terms?.extended?.usageRestrictions, DEFAULT_EXTENDED_TERMS.usageRestrictions!),
      allowPortfolioDisplay: terms?.extended?.allowPortfolioDisplay ?? true,
      requireCredit: terms?.extended?.requireCredit ?? true,
      prohibitAiTraining: terms?.extended?.prohibitAiTraining ?? true,
      prohibitResale: terms?.extended?.prohibitResale ?? true,
      customClauses,
    },
    updatedAt: terms?.updatedAt ?? null,
  };
}

export function CreatorTermsOverview({
  terms,
  creatorName,
  compact = false,
}: {
  terms?: CreatorTermsDto | null;
  creatorName?: string;
  compact?: boolean;
}) {
  const data = normalizeCreatorTerms(terms);
  const ext = data.extended;
  const customClauses = ext.customClauses ?? [];
  const mult = Number(data.commercialLicenseMultiplier);
  const sampleCommercialPrice = new Intl.NumberFormat('vi-VN').format(Math.round(1_000_000 * mult));

  const permissionItems: Array<{
    label: string;
    enabled: boolean;
    icon: 'check' | 'x' | 'lock';
    text: string;
  }> = [
    {
      label: 'Đăng Portfolio (có watermark)',
      enabled: ext.allowPortfolioDisplay,
      icon: ext.allowPortfolioDisplay ? 'check' : 'lock',
      text: ext.allowPortfolioDisplay ? 'Creator được phép đăng' : 'Giữ kín riêng tư',
    },
    {
      label: 'Ghi nguồn tác giả (Credit)',
      enabled: ext.requireCredit,
      icon: ext.requireCredit ? 'check' : 'x',
      text: ext.requireCredit ? 'Bắt buộc ghi nguồn' : 'Không bắt buộc',
    },
    {
      label: 'Bảo vệ trước AI / NFT',
      enabled: ext.prohibitAiTraining,
      icon: ext.prohibitAiTraining ? 'check' : 'x',
      text: ext.prohibitAiTraining ? 'Cấm đưa vào AI / NFT' : 'Theo thỏa thuận riêng',
    },
    {
      label: 'Chống bán lại (gói Cá nhân)',
      enabled: ext.prohibitResale,
      icon: ext.prohibitResale ? 'lock' : 'check',
      text: ext.prohibitResale ? 'Không bán lại / chuyển nhượng' : 'Có thể thỏa thuận riêng',
    },
  ];

  return (
    <div className={compact ? 'space-y-4 text-xs font-[family-name:var(--font-ui)]' : 'space-y-5 text-sm font-[family-name:var(--font-ui)]'}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--hair)] pb-3">
        <div>
          <p className="font-[family-name:var(--font-display)] font-bold text-[var(--ivory)] text-base">
            {creatorName ? `Điều khoản dịch vụ của ${creatorName}` : 'Điều khoản dịch vụ (ToS) của Creator'}
          </p>
          {data.updatedAt && (
            <p className="mt-1 text-[11px] text-[var(--ash)]">
              Cập nhật lần cuối: {new Date(data.updatedAt).toLocaleDateString('vi-VN')}
            </p>
          )}
        </div>
        <span className="rounded-full border border-[var(--hair-2)] bg-[var(--ink-3)] px-3 py-1 font-mono text-[11px] font-medium text-[var(--ash)]">
          Phiên bản v{ext.version}
        </span>
      </div>

      {/* Bản quyền & Hệ số */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--hair-2)] bg-[var(--ink-3)] p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[var(--ivory)]">Cá nhân (Personal)</span>
            <span className="text-xs font-semibold text-[var(--ash)] font-[family-name:var(--font-ui)]">1.0× giá gốc</span>
          </div>
          <p className="mt-2.5 text-xs leading-relaxed text-[var(--ash)] py-1">
            Sử dụng phi thương mại: avatar, hình nền, lưu niệm cá nhân.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--hair-2)] bg-[var(--ink-3)] p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[var(--ivory)]">Thương mại (Commercial)</span>
            <span className="text-xs font-bold text-[var(--lumen)] font-[family-name:var(--font-ui)]">
              {mult.toFixed(1).replace(/\.0$/, '')}× giá gốc
            </span>
          </div>
          <p className="mt-2.5 text-xs leading-relaxed text-[var(--ivory)] py-1">{ext.commercialScope}</p>
          <p className="mt-2 text-[11px] text-[var(--ash)] py-0.5">
            Ví dụ: gói 1.000.000đ → <strong className="font-semibold text-[var(--lumen)]">{sampleCommercialPrice}đ</strong> khi chọn Thương mại.
          </p>
        </div>
      </div>

      {/* Quy tắc bản quyền nhanh */}
      <div className="grid gap-2 sm:grid-cols-2">
        {permissionItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--hair-2)] bg-[var(--ink-3)] px-3.5 py-3 text-xs"
          >
            <span className="text-[var(--ash)]">{item.label}</span>
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 font-medium ${
                item.enabled ? 'text-[var(--ivory)]' : 'text-[var(--ash)]'
              }`}
            >
              {item.icon === 'check' ? (
                <Check className={`h-3.5 w-3.5 ${item.enabled ? 'text-[var(--lumen)]' : 'text-[var(--ash)]'}`} />
              ) : item.icon === 'lock' ? (
                <Lock className={`h-3.5 w-3.5 ${item.enabled ? 'text-[var(--lumen)]' : 'text-[var(--ash)]'}`} />
              ) : (
                <X className="h-3.5 w-3.5 text-[var(--ash)]" />
              )}
              {item.text}
            </span>
          </div>
        ))}
      </div>

      {/* Will Draw / Won't Draw */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--hair-2)] bg-[var(--ink-3)] p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            Nhận vẽ (Will Draw)
          </p>
          <p className="mt-2.5 whitespace-pre-line text-xs leading-relaxed text-[var(--ivory)] py-1">{ext.willDraw}</p>
        </div>
        <div className="rounded-xl border border-[var(--hair-2)] bg-[var(--ink-3)] p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
            <Ban className="h-4 w-4" />
            Không nhận vẽ (Won&apos;t Draw)
          </p>
          <p className="mt-2.5 whitespace-pre-line text-xs leading-relaxed text-[var(--ivory)] py-1">{ext.wontDraw}</p>
        </div>
      </div>

      {/* Lưu ý & giới hạn khác */}
      <div className="rounded-xl border border-[var(--hair-2)] bg-[var(--ink-3)] p-4">
        <h4 className="text-xs font-bold text-[var(--ivory)]">Lưu ý &amp; giới hạn sử dụng</h4>
        <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-[var(--ash)] py-1">{ext.usageRestrictions}</p>
      </div>

      {/* Điều khoản bổ sung riêng của Creator */}
      {customClauses.length > 0 && (
        <div className="divide-y divide-[var(--hair)] rounded-xl border border-[var(--hair-2)] bg-[var(--ink-3)]">
          <div className="flex items-center gap-1.5 px-4 py-3 text-xs font-bold text-[var(--lumen)]">
            <FilePlus2 className="h-4 w-4" />
            <span>Điều khoản bổ sung riêng</span>
          </div>
          {customClauses.map((clause, index) => (
            <div key={`${clause.title}-${index}`} className="p-4">
              <h4 className="text-xs font-bold text-[var(--ivory)]">{clause.title}</h4>
              {clause.content && (
                <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-[var(--ash)] py-1">{clause.content}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="flex items-start gap-2.5 rounded-xl border border-[var(--hair-2)] bg-[var(--ink-3)] px-4 py-3 text-[11px] leading-relaxed text-[var(--ash)]">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--lumen)]" />
        <span>
          Quy trình đặt vẽ, số lần chỉnh sửa theo từng mốc gói vẽ, chính sách hủy đơn (Escrow / 48h) và tự động nghiệm thu sau 72 giờ được áp dụng thống nhất theo quy chế của Dillustration.
        </span>
      </p>
    </div>
  );
}
