export interface NoteWithAttachments {
  text: string;
  images: string[];
}

/**
 * Trích xuất text ghi chú và danh sách URL ảnh đính kèm từ dữ liệu note của ArtTrade.
 * Tương thích ngược: nếu là chuỗi thuần trước đó, trả về text và images rỗng.
 */
export function parseNoteWithAttachments(rawNote?: string | null): NoteWithAttachments {
  if (!rawNote || !rawNote.trim()) {
    return { text: '', images: [] };
  }

  const trimmed = rawNote.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'object' && parsed !== null && ('text' in parsed || 'images' in parsed)) {
        return {
          text: typeof parsed.text === 'string' ? parsed.text : '',
          images: Array.isArray(parsed.images)
            ? parsed.images.filter((img: unknown): img is string => typeof img === 'string' && img.length > 0)
            : [],
        };
      }
    } catch {
      // Not JSON, continue to fallback
    }
  }

  return { text: trimmed, images: [] };
}

/**
 * Đóng gói text ghi chú và danh sách URL ảnh đính kèm.
 * Nếu không có ảnh, lưu chuỗi thuần để tối ưu dung lượng; nếu có ảnh, lưu JSON cấu trúc { text, images }.
 */
export function formatNoteWithAttachments(text: string, images: string[]): string {
  const cleanImages = (images || []).filter((img) => typeof img === 'string' && img.trim().length > 0);
  if (cleanImages.length === 0) {
    return text.trim();
  }
  return JSON.stringify({
    text: text.trim(),
    images: cleanImages,
  });
}

