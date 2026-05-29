import type { Root } from "mdast"
import getReadingTime from "reading-time"
import { toString } from "mdast-util-to-string"

export default function remarkFrontmatter() {
  return function (tree: Root, { data }: { data: any }) {
    // Find the first H1 heading
    const firstH1Index = tree.children.findIndex(
      (node) => node.type === "heading" && node.depth === 1
    )

    if (firstH1Index !== -1) {
      const headingNode = tree.children[firstH1Index]
      const title = toString(headingNode)

      // Set title in frontmatter if it doesn't exist
      if (!data.astro.frontmatter.title) {
        data.astro.frontmatter.title = title
      }

      // Remove the H1 from the tree
      tree.children.splice(firstH1Index, 1)
    }

    const textOnPage = toString(tree)
    const { words, minutes } = getReadingTime(textOnPage)
    data.astro.frontmatter.words = words
    data.astro.frontmatter.minutes = minutes
  }
}
