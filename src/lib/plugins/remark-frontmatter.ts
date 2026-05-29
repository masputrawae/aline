import type { Root } from "mdast"
import getReadingTime from "reading-time"
import { toString } from "mdast-util-to-string"

export default function remarkFrontmatter() {
  return function(tree: Root, { data }: { data: any }) {
    const textOnPage = toString(tree)
    const { words, minutes } = getReadingTime(textOnPage)
    data.astro.frontmatter.words = words
    data.astro.frontmatter.minutes = minutes
  }
}
