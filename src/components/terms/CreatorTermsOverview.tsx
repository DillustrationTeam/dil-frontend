'use client';

import { Ban, Check, FilePlus2, Lock, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
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

/**
 * Bản tiếng Anh của các giá trị mặc định. Creator chưa cấu hình ToS thì UI hiển thị đúng
 * chuỗi mặc định ở trên, nên chỉ cần map khớp tuyệt đối — nội dung creator tự nhập
 * (khác chuỗi mặc định) được giữ nguyên, không dịch máy.
 */
const DEFAULT_EXTENDED_TERMS_EN = {
  willDraw: 'Original characters (OC), anime/game fanart, portrait illustrations, couples.',
  wontDraw: '18+/NSFW content, hateful or political themes, overly complex mecha.',
  commercialScope:
    'Use on livestream channels, YouTube, promotional banners, or commemorative prints under the commercial agreement.',
  usageRestrictions:
    'Do not modify or distort the original artwork without prior discussion. Layered source files (.PSD/.CLIP) are handed over only under a separate agreement.',
};

const EN_DEFAULT_LOOKUP: Record<string, string> = {
  [DEFAULT_EXTENDED_TERMS.willDraw as string]: DEFAULT_EXTENDED_TERMS_EN.willDraw,
  [DEFAULT_EXTENDED_TERMS.wontDraw as string]: DEFAULT_EXTENDED_TERMS_EN.wontDraw,
  [DEFAULT_EXTENDED_TERMS.commercialScope as string]: DEFAULT_EXTENDED_TERMS_EN.commercialScope,
  [DEFAULT_EXTENDED_TERMS.usageRestrictions as string]: DEFAULT_EXTENDED_TERMS_EN.usageRestrictions,
};

const localizeDefault = (value: string | null | undefined, isVie: boolean): string => {
  if (!value) return '';
  return isVie ? value : (EN_DEFAULT_LOOKUP[value] ?? value);
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
    description: 'Cân bằng quyền lợi cho đặt vẽ cá nhân & thương mại phổ biến.',
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
          'Bao gồm phát sóng livestream, thumbnail, merch in ấn và ấn phẩm truyền thông thương hiệu của chính khách hàng.',
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
  const { lang } = useLanguage();
  const isVie = lang === 'VIE';
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
      label: isVie ? 'Đăng hồ sơ tác phẩm (có dấu chìm)' : 'Portfolio display (watermarked)',
      enabled: ext.allowPortfolioDisplay,
      icon: ext.allowPortfolioDisplay ? 'check' : 'lock',
      text: ext.allowPortfolioDisplay
        ? (isVie ? 'Họa sĩ được phép đăng' : 'Artist may post')
        : (isVie ? 'Giữ kín riêng tư' : 'Keep private'),
    },
    {
      label: isVie ? 'Ghi nguồn tác giả' : 'Creator attribution',
      enabled: ext.requireCredit,
      icon: ext.requireCredit ? 'check' : 'x',
      text: ext.requireCredit
        ? (isVie ? 'Bắt buộc ghi nguồn' : 'Credit required')
        : (isVie ? 'Không bắt buộc' : 'Not required'),
    },
    {
      label: isVie ? 'Bảo vệ trước AI / NFT' : 'Anti-AI / NFT protection',
      enabled: ext.prohibitAiTraining,
      icon: ext.prohibitAiTraining ? 'check' : 'x',
      text: ext.prohibitAiTraining
        ? (isVie ? 'Cấm đưa vào AI / NFT' : 'No AI / NFT usage')
        : (isVie ? 'Theo thỏa thuận riêng' : 'By separate agreement'),
    },
    {
      label: isVie ? 'Chống bán lại (gói Cá nhân)' : 'No resale (Personal tier)',
      enabled: ext.prohibitResale,
      icon: ext.prohibitResale ? 'lock' : 'check',
      text: ext.prohibitResale
        ? (isVie ? 'Không bán lại / chuyển nhượng' : 'No resale / transfer')
        : (isVie ? 'Có thể thỏa thuận riêng' : 'May be agreed separately'),
    },
  ];

  return (
    <div className={compact ? 'space-y-4 text-xs' : 'space-y-5 text-sm'}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#221E1A]/10 pb-3">
        <div>
          <p className="font-h1 font-bold text-[#241F1A]">
            {creatorName
              ? (isVie ? `Điều khoản dịch vụ của ${creatorName}` : `Terms of Service of ${creatorName}`)
              : (isVie ? 'Điều khoản dịch vụ (ToS) của họa sĩ' : 'Creator Terms of Service (ToS)')}
          </p>
          {data.updatedAt && (
            <p className="mt-0.5 text-[11px] text-[#746A5F]">
              {isVie ? 'Cập nhật lần cuối:' : 'Last updated:'}{' '}
              {new Date(data.updatedAt).toLocaleDateString(isVie ? 'vi-VN' : 'en-GB')}
            </p>
          )}
        </div>
        <span className="rounded-full border border-[#221E1A]/10 bg-[#FFFCF6] px-2.5 py-1 font-mono text-[11px] font-medium text-[#6E6459]">
          {isVie ? 'Phiên bản' : 'Version'} v{ext.version}
        </span>
      </div>

      {/* Bản quyền & Hệ số: giữ nhấn giá thương mại bằng #A8321C có chủ đích */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-[#FFFCF6] p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#241F1A]">{isVie ? 'Cá nhân' : 'Personal Use'}</span>
            <span className="font-mono text-xs font-semibold text-[#6E6459]">{isVie ? '1.0× giá gốc' : '1.0× base price'}</span>
          </div>
          <p className="mt-1.5 text-xs leading-5 text-[#6E6459]">
            {isVie
              ? 'Sử dụng phi thương mại: avatar, hình nền, lưu niệm cá nhân.'
              : 'Non-commercial use: avatars, wallpapers, personal keepsakes.'}
          </p>
        </div>

        <div className="rounded-xl bg-[#B24A26]/[.08] p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#241F1A]">{isVie ? 'Thương mại' : 'Commercial Use'}</span>
            <span className="font-mono text-xs font-bold text-[#A8321C]">
              {mult.toFixed(1).replace(/\.0$/, '')}× {isVie ? 'giá gốc' : 'base price'}
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-5 text-[#241F1A]">{localizeDefault(ext.commercialScope, isVie)}</p>
          <p className="mt-1.5 text-[11px] text-[#746A5F]">
            {isVie ? 'Ví dụ: gói 1.000.000đ → ' : 'e.g. 1,000,000đ package → '}
            <strong className="font-medium text-[#241F1A]">{sampleCommercialPrice}đ</strong>{' '}
            {isVie ? 'khi chọn Thương mại.' : 'when Commercial is selected.'}
          </p>
        </div>
      </div>

      {/* Quy tắc bản quyền nhanh: đồng nhất màu chữ trung tính + icon nhấn thống nhất */}
      <div className="grid gap-2 sm:grid-cols-2">
        {permissionItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 rounded-xl bg-[#FFFCF6] px-3 py-2.5 text-xs"
          >
            <span className="text-[#6E6459]">{item.label}</span>
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 font-medium ${
                item.enabled ? 'text-[#241F1A]' : 'text-[#746A5F]'
              }`}
            >
              {item.icon === 'check' ? (
                <Check className={`h-3.5 w-3.5 ${item.enabled ? 'text-[#B24A26]' : 'text-[#746A5F]'}`} />
              ) : item.icon === 'lock' ? (
                <Lock className={`h-3.5 w-3.5 ${item.enabled ? 'text-[#B24A26]' : 'text-[#746A5F]'}`} />
              ) : (
                <X className="h-3.5 w-3.5 text-[#746A5F]" />
              )}
              {item.text}
            </span>
          </div>
        ))}
      </div>

      {/* Will Draw / Won't Draw: giữ màu xanh / đỏ có chủ đích để phân biệt Nhận vs Từ chối */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-[#FFFCF6] p-3.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[#2F6B63]">
            <ShieldCheck className="h-3.5 w-3.5" /> {isVie ? 'Nhận vẽ (Will Draw)' : 'Will Draw'} </p>
          <p className="mt-1.5 whitespace-pre-line text-xs leading-5 text-[#241F1A]">{localizeDefault(ext.willDraw, isVie)}</p>
        </div>
        <div className="rounded-xl bg-[#FFFCF6] p-3.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[#A8321C]">
            <Ban className="h-3.5 w-3.5" />
            {isVie ? "Không nhận vẽ (Won't Draw)" : "Won't Draw"}
          </p>
          <p className="mt-1.5 whitespace-pre-line text-xs leading-5 text-[#241F1A]">{localizeDefault(ext.wontDraw, isVie)}</p>
        </div>
      </div>

      {/* Lưu ý & giới hạn khác */}
      <div className="rounded-xl bg-[#FFFCF6] p-3.5">
        <h4 className="text-xs font-semibold text-[#241F1A]">{isVie ? 'Lưu ý & giới hạn sử dụng' : 'Usage notes & limits'}</h4>
        <p className="mt-1 whitespace-pre-line text-xs leading-5 text-[#6E6459]">{localizeDefault(ext.usageRestrictions, isVie)}</p>
      </div>

      {/* Điều khoản bổ sung riêng của Creator */}
      {customClauses.length > 0 && (
        <div className="divide-y divide-[#221E1A]/10 rounded-xl bg-[#FFFCF6]">
          <div className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-[#A8321C]">
            <FilePlus2 className="h-3.5 w-3.5" />
            <span>{isVie ? 'Điều khoản bổ sung riêng' : 'Creator-specific addenda'}</span>
          </div>
          {customClauses.map((clause, index) => (
            <div key={`${clause.title}-${index}`} className="p-3.5">
              <h4 className="text-xs font-semibold text-[#241F1A]">{clause.title}</h4>
              {clause.content && (
                <p className="mt-1 whitespace-pre-line text-xs leading-5 text-[#6E6459]">{clause.content}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="flex items-start gap-2 rounded-xl bg-[#FFFCF6] px-3 py-2.5 text-[11px] leading-5 text-[#746A5F]">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B24A26]" />
        <span>
          {isVie
            ? 'Quy trình đặt vẽ, số lần chỉnh sửa theo từng mốc gói vẽ, chính sách hủy đơn (ký quỹ / 48h) và tự động nghiệm thu sau 72 giờ được áp dụng thống nhất theo quy chế của Dillustration.'
            : 'Commission workflow, milestone revision limits, 48h escrow cancellation policy, and 72h auto-approval apply uniformly under Dillustration rules.'}
        </span>
      </p>
    </div>
  );
}
