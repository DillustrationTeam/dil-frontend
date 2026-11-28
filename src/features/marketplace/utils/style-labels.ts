/**
 * Nhãn tiếng Việt cho danh mục / phong cách vẽ.
 *
 * Tên trong DB là tiếng Anh (`Anime / Manga`, `Concept Art`, `Semi-Realistic`…).
 * Hàm này chỉ đổi NHÃN hiển thị; slug và tên gốc vẫn dùng để lọc, gọi API.
 */

const STYLE_VI: Record<string, string> = {
  // 8 danh mục chính trong DB
  'anime / manga': 'Anime / Truyện tranh',
  'anime-manga': 'Anime / Truyện tranh',
  'concept art': 'Ý tưởng thiết kế',
  'concept-art': 'Ý tưởng thiết kế',
  'chibi / cute': 'Chibi / Dễ thương',
  'chibi-cute': 'Chibi / Dễ thương',
  'semi-realistic': 'Bán thực tế',
  'realistic / portrait': 'Thực tế / Chân dung',
  'realistic-portrait': 'Thực tế / Chân dung',
  'mecha / sci-fi': 'Máy móc / Viễn tưởng',
  'mecha-sci-fi': 'Máy móc / Viễn tưởng',
  'landscape / background': 'Phong cảnh / Bối cảnh',
  'landscape-background': 'Phong cảnh / Bối cảnh',
  'pixel art': 'Điểm ảnh',
  'pixel-art': 'Điểm ảnh',

  // phong cách tự do hay xuất hiện trong dữ liệu
  cyberpunk: 'Cyberpunk',
  'dark fantasy': 'Giả tưởng tối',
  'dark fantasy & ethereal character designer': 'Thiết kế nhân vật giả tưởng tối & huyền ảo',
  fantasy: 'Giả tưởng',
  'fantasy environment': 'Bối cảnh giả tưởng',
  'sci-fi': 'Viễn tưởng',
  'sci-fi concept': 'Ý tưởng viễn tưởng',
  'sci-fi anime': 'Anime viễn tưởng',
  'sci-fi world': 'Thế giới viễn tưởng',
  mecha: 'Máy móc',
  'mecha concept': 'Ý tưởng máy móc',
  'hard-surface': 'Bề mặt cứng',
  'weapon concept': 'Ý tưởng vũ khí',
  'character design': 'Thiết kế nhân vật',
  'character illustration': 'Minh hoạ nhân vật',
  'character art & key visuals': 'Minh hoạ nhân vật & hình chủ đạo',
  environment: 'Bối cảnh',
  'epic environments': 'Bối cảnh hoành tráng',
  'slice of life': 'Đời thường',
  'lo-fi slice of life': 'Đời thường lo-fi',
  'watercolor': 'Màu nước',
  'anime pastel': 'Anime pastel',
  ethereal: 'Huyền ảo',
  'mythic characters': 'Nhân vật thần thoại',
  'portrait': 'Chân dung',
  'background': 'Bối cảnh',
};

export function localizeStyle(name?: string | null): string {
  if (!name) return '';
  const key = name.trim().toLowerCase();
  return STYLE_VI[key] ?? name;
}
