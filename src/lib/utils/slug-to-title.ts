export function slugToTitle(slug?: string): string {
  if (!slug || !slug.trim()) return "";
  return slug
    ?.replace(/\.(md|mdx)$/, "")
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

