/**
 * Bộ kiểm tra và phân tích liên kết / tệp tham khảo (Reference link & file validator)
 * Đảm bảo an toàn bảo mật (chặn SSRF, XSS, giao thức nguy hiểm) và trải nghiệm người dùng tối ưu.
 */

export type ReferenceType = 'image' | 'drive' | 'pinterest' | 'dropbox' | 'pdf' | 'link';

export interface ReferenceLinkValidation {
  isValid: boolean;
  error?: string;
  normalizedUrl?: string;
  domain?: string;
  type?: ReferenceType;
}

const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '0.0.0.0',
  '169.254.169.254',
]);

function isPrivateIp(hostname: string): boolean {
  const parts = hostname.split('.').map(Number);
  if (parts.length === 4 && parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    // 10.0.0.0/8
    if (parts[0] === 10) return true;
    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 169.254.0.0/16
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 127.0.0.0/8
    if (parts[0] === 127) return true;
  }
  return false;
}

export function validateReferenceLink(input: string): ReferenceLinkValidation {
  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Vui lòng nhập đường dẫn liên kết tham khảo.' };
  }

  if (/\s/.test(trimmed)) {
    return { isValid: false, error: 'Đường dẫn liên kết không đúng định dạng URL (không được chứa khoảng trắng).' };
  }

  // Chặn giao thức nguy hiểm hoặc giao thức lạ
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('file:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('blob:')
  ) {
    return { isValid: false, error: 'Giao thức không được phép vì lý do an toàn.' };
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    return { isValid: false, error: 'Chỉ chấp nhận liên kết web bắt đầu bằng http:// hoặc https://.' };
  }

  // Thêm https:// nếu người dùng quên nhập scheme
  let urlToParse = trimmed;
  if (!/^https?:\/\//i.test(trimmed)) {
    urlToParse = `https://${trimmed}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(urlToParse);
  } catch {
    return { isValid: false, error: 'Đường dẫn liên kết không đúng định dạng URL.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isValid: false, error: 'Chỉ chấp nhận liên kết web bắt đầu bằng http:// hoặc https://.' };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    BLOCKED_HOSTS.has(hostname) ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.lan') ||
    isPrivateIp(hostname)
  ) {
    return { isValid: false, error: 'Không thể sử dụng địa chỉ mạng nội bộ hoặc máy chủ cục bộ.' };
  }

  // Kiểm tra tên miền hợp lệ (phải có ít nhất 1 dấu chấm, TLD hợp lệ >= 2 ký tự, không chứa ký tự đặc biệt lạ)
  const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  const isValidDomain =
    !hostname.includes('..') &&
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i.test(hostname);

  if (!isIpv4 && !isValidDomain) {
    return { isValid: false, error: 'Đường dẫn liên kết không đúng định dạng URL (tên miền không hợp lệ).' };
  }

  if (trimmed.length > 2000) {
    return { isValid: false, error: 'Đường dẫn liên kết quá dài (tối đa 2000 ký tự).' };
  }

  // Phân loại nguồn tài liệu tham khảo
  let type: ReferenceType = 'link';
  const pathname = parsed.pathname.toLowerCase();

  if (hostname.includes('drive.google.com') || hostname.includes('docs.google.com')) {
    type = 'drive';
  } else if (hostname.includes('pinterest.com') || hostname === 'pin.it') {
    type = 'pinterest';
  } else if (hostname.includes('dropbox.com')) {
    type = 'dropbox';
  } else if (pathname.endsWith('.pdf')) {
    type = 'pdf';
  } else if (
    /\.(png|jpe?g|webp|gif|avif|bmp)(\?|$)/i.test(pathname) ||
    hostname.includes('imgur.com') ||
    hostname.includes('cloudinary.com')
  ) {
    type = 'image';
  }

  return {
    isValid: true,
    normalizedUrl: parsed.href,
    domain: hostname.replace(/^www\./, ''),
    type,
  };
}

export const MAX_REFERENCE_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_REFERENCE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/x-pdf',
  'application/acrobat',
  'application/vnd.pdf',
  'text/pdf',
];
export const ALLOWED_REFERENCE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf'];

export function validateReferenceFile(file: File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'Không có tệp nào được chọn.' };
  }

  if (file.size <= 0) {
    return { isValid: false, error: 'Tệp đã chọn bị rỗng (0 bytes).' };
  }

  if (file.size > MAX_REFERENCE_FILE_SIZE) {
    return { isValid: false, error: `Dung lượng tệp "${file.name}" vượt quá mức 10MB cho phép.` };
  }

  const hasDot = file.name.includes('.');
  const ext = hasDot ? `.${file.name.split('.').pop()?.toLowerCase() || ''}` : '';
  const isExtAllowed = ALLOWED_REFERENCE_EXTENSIONS.includes(ext);
  const isMimeAllowed = file.type === ''
    ? isExtAllowed
    : ALLOWED_REFERENCE_MIME_TYPES.includes(file.type.toLowerCase());

  if (!isExtAllowed || !isMimeAllowed) {
    return {
      isValid: false,
      error: `Định dạng tệp "${file.name}" không được hỗ trợ. Vui lòng chọn ảnh JPG, PNG, WebP, GIF hoặc tệp PDF.`,
    };
  }

  return { isValid: true };
}
