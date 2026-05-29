import path from "node:path"
import type { CollectionEntry } from "astro:content"

/**
 * Union of all content collections that can be listed under an index.
 */
export type ContentEntry = CollectionEntry<
  "blog" | "notes" | "projects" | "index"
>

/**
 * Groups content entries and sub-sections under their respective index sections.
 *
 * This creates a parent-child relationship based on folder structure:
 * - Files in `registry/blog/` will be children of the `blog` index.
 * - Folders in `registry/notes/` will be children of the `notes` index.
 *
 * @param sections - List of entries from the 'index' collection.
 * @param contents - List of all content entries to be grouped.
 * @returns A Map where keys are section IDs and values are arrays of child entries.
 */
export function groupIndexWithPage(
  sections: CollectionEntry<"index">[],
  contents: ContentEntry[]
): Map<string, ContentEntry[]> {
  const results = new Map<string, ContentEntry[]>()

  // Initialize the map with all available index sections
  for (const section of sections) {
    results.set(section.id, [])
  }

  // Group content entries under their parent sections
  for (const entry of contents) {
    const parts = entry.id.split("/").filter(Boolean)

    // Determine the parent path by joining collection name and folder path
    // e.g., blog/my-post -> parent is 'blog'
    // e.g., notes/folder/sub-note -> parent is 'notes/folder'
    const sectionPath = path.join(
      entry.collection,
      parts.slice(0, -1).join("/")
    )

    if (results.has(sectionPath)) {
      results.get(sectionPath)!.push(entry)
    }
  }

  // Group sub-sections under their parent sections (for nested navigation)
  for (const section of sections) {
    const parts = section.id.split("/").filter(Boolean)
    const sectionPath = parts.slice(0, -1).join("/")

    if (results.has(sectionPath)) {
      results.get(sectionPath)!.push(section)
    }
  }

  return results
}
