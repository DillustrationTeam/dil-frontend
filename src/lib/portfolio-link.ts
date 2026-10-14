// Backend chỉ lưu portfolioLinks dưới dạng 1 mảng string, không phân biệt link ứng viên tự dán
// (Behance/ArtStation...) và URL ảnh mẫu họ upload lên Cloudinary. Dùng hàm này để tách 2 loại
// ra khi hiển thị/khôi phục form, tránh lẫn URL Cloudinary vào ô nhập link thủ công.
export function isPortfolioImageUrl(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(url) || url.includes('res.cloudinary.com');
}

export function splitPortfolioLinks(portfolioLinks: string[]): {
  manualLinks: string[];
  uploadedImages: string[];
} {
  const manualLinks = portfolioLinks.filter((link) => !isPortfolioImageUrl(link));
  const uploadedImages = portfolioLinks.filter((link) => isPortfolioImageUrl(link));
  return { manualLinks, uploadedImages };
}
