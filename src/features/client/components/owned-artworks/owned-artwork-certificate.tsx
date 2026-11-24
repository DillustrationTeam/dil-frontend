'use client';

import { useState } from 'react';
import { Check, ExternalLink, FileCheck2, Printer, X } from 'lucide-react';

import type { OwnedArtworkDto } from '../../types/owned-artwork.types';

type Props = {
  artwork: OwnedArtworkDto;
  /** Nhãn hình thức sở hữu đã Việt hoá (Đấu giá / Đơn đặt vẽ / Trao đổi). */
  sourceLabel: string;
  lang: string;
  onClose: () => void;
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatPrice(value?: number | null) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

const EXCLUSIVE: Record<string, { vi: string; en: string }> = {
  'Exclusive Owner': { vi: 'Chủ sở hữu độc bản', en: 'Exclusive owner' },
  '1/1': { vi: 'Độc bản 1/1', en: 'One of one' },
};

/**
 * Chứng nhận quyền sở hữu — chỉ in ra những gì bản ghi THẬT SỰ có.
 *
 * Không có mã băm tệp, không có chữ ký số, không có kích thước/DPI: API chứng nhận
 * của phiên đấu giá (`/auctions/{id}/certificate`) trả 404 cho tác phẩm đã sở hữu
 * vì `sourceId` trùng id tác phẩm. Thà một tờ chứng nhận mỏng mà đúng, còn hơn in
 * lên đó những trường không tồn tại.
 */
export function OwnedArtworkCertificate({ artwork, sourceLabel, lang, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const isVi = lang === 'VIE';

  const copy = async () => {
    if (!artwork.certificateNumber) return;
    try {
      await navigator.clipboard.writeText(artwork.certificateNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const exclusive = artwork.exclusiveBadge
    ? (EXCLUSIVE[artwork.exclusiveBadge.trim()]?.[isVi ? 'vi' : 'en'] ?? artwork.exclusiveBadge)
    : '';

  return (
    <div
      className="cert-scrim"
      role="dialog"
      aria-modal="true"
      aria-label={isVi ? 'Chứng nhận quyền sở hữu' : 'Certificate of ownership'}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="cert">
        <header className="cert__head">
          <div className="cert__headtext">
            <p className="cert__eyebrow">
              {isVi ? 'Chứng nhận quyền sở hữu số' : 'Digital certificate of ownership'}
            </p>
            <h2 className="cert__title">{artwork.title}</h2>
            <p className="cert__sub">
              {artwork.creatorName}
              {exclusive ? ` · ${exclusive}` : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} className="cert__close" aria-label={isVi ? 'Đóng' : 'Close'}>
            <X aria-hidden />
          </button>
        </header>

        <div className="cert__body">
          <span className="cert__seal" aria-hidden="true">
            <FileCheck2 />
          </span>
          <p className="cert__label">{isVi ? 'Mã chứng nhận' : 'Certificate number'}</p>
          <p className="cert__code">{artwork.certificateNumber || '—'}</p>
          {artwork.certificateNumber ? (
            <button type="button" className="cert__copy" onClick={() => void copy()}>
              {copied ? <Check aria-hidden /> : null}
              {copied ? (isVi ? 'Đã sao chép' : 'Copied') : isVi ? 'Sao chép mã' : 'Copy number'}
            </button>
          ) : null}

          <dl className="cert__facts">
            <div>
              <dt>{isVi ? 'Họa sĩ' : 'Artist'}</dt>
              <dd>{artwork.creatorName || '—'}</dd>
            </div>
            <div>
              <dt>{isVi ? 'Ngày sở hữu' : 'Acquired'}</dt>
              <dd>{formatDate(artwork.acquiredAt)}</dd>
            </div>
            <div>
              <dt>{isVi ? 'Hình thức' : 'Source'}</dt>
              <dd>{sourceLabel}</dd>
            </div>
            <div>
              <dt>{isVi ? 'Giá sở hữu' : 'Price paid'}</dt>
              <dd>{formatPrice(artwork.price)}</dd>
            </div>
          </dl>

          <p className="cert__note">
            {isVi
              ? 'Chứng nhận do Dillustration cấp khi giao dịch hoàn tất. Mã trên là căn cứ đối chiếu khi cần hỗ trợ; hệ thống chưa có trang tra cứu công khai.'
              : 'Issued by Dillustration once the transaction completed. The number above is the reference for support; there is no public lookup page yet.'}
          </p>
        </div>

        <footer className="cert__foot">
          <button type="button" onClick={() => window.print()} className="cert__btn cert__btn--ghost">
            <Printer aria-hidden /> {isVi ? 'In / Lưu PDF' : 'Print / Save PDF'}
          </button>
          {artwork.sourceDetailUrl ? (
            <a href={artwork.sourceDetailUrl} className="cert__btn">
              {isVi ? 'Mở tác phẩm' : 'Open artwork'} <ExternalLink aria-hidden />
            </a>
          ) : null}
        </footer>
      </div>
    </div>
  );
}

export default OwnedArtworkCertificate;
