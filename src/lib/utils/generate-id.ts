// PATH: ./src/utils/generate-id.ts

import BananaSlug from "github-slugger"

export function slugger(raw: string): string {
  if (!raw || !raw.trim()) return ""
  const slugify = new BananaSlug()

  const n = raw
    .trim()
    .split("/")
    .filter(Boolean)
    .map((p) => slugify.slug(p))
    .join("/")

  return n === "" ? "/" : n
}

export function normalizePath(raw: string): string {
  if (!raw || !raw.trim()) return ""

  let n = raw.trim().replace(/\\/g, "/")
  n = n.replace(/\/+$/, "")
  n = n.replace(/\.(md|mdx)$/i, "")
  n = n.replace(/(^|[\\/])[_]?index$/i, "$1")

  return n === "" ? "/" : n
}

export function generateId(raw: string): string {
  if (!raw || !raw.trim()) return ""
  return slugger(normalizePath(raw))
}
