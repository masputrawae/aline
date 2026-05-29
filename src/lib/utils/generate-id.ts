import BananaSlug from "github-slugger"

/**
 * Creates a URL-friendly slug from a raw string.
 * Handles nested paths by slugifying each segment.
 */
export function slugger(raw: string): string {
  if (!raw || !raw.trim()) return ""
  const slugify = new BananaSlug()

  const segments = raw
    .trim()
    .split("/")
    .filter(Boolean)
    .map((p) => slugify.slug(p))

  const result = segments.join("/")
  return result === "" ? "/" : result
}

/**
 * Normalizes a file path for ID generation:
 * 1. Converts backslashes to forward slashes.
 * 2. Removes trailing slashes.
 * 3. Strips .md/.mdx extensions.
 * 4. Removes 'index' or '_index' filename from the path.
 */
export function normalizePath(raw: string): string {
  if (!raw || !raw.trim()) return ""

  let n = raw.trim().replace(/\\/g, "/")
  n = n.replace(/\/+$/, "")
  n = n.replace(/\.(md|mdx)$/i, "")

  // Remove index filenames but keep the directory path
  // registry/blog/index -> registry/blog
  n = n.replace(/(^|[\\/])[_]?index$/i, "$1")

  return n === "" ? "/" : n
}

/**
 * Generates a clean, slugified ID from a file path.
 * Used for consistent routing across collections.
 */
export function generateId(raw: string): string {
  if (!raw || !raw.trim()) return ""
  return slugger(normalizePath(raw))
}
