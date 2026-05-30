/** Aumenta resolução de thumbnails da Wikimedia para exibição em alta qualidade */
export function upgradeProductImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url
    .replace(/\/(\d+)px-/g, '/1200px-')
    .replace(/\/thumb\//g, '/thumb/')
    .replace(/(\d+)px-([^.]+\.(?:jpg|jpeg|png|webp))/i, '1200px-$2');
}
