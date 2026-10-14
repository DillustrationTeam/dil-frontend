export function isPortfolioImageUrl(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(url) || url.includes('res.cloudinary.com');
}

export function splitPortfolioLinks(portfolioLinks: string[]): { manualLinks: string[]; uploadedImages: string[] } {
  return {
    manualLinks: portfolioLinks.filter((link) => !isPortfolioImageUrl(link)),
    uploadedImages: portfolioLinks.filter(isPortfolioImageUrl),
  };
}