import type { Link, Root } from "mdast"
import type { Plugin } from "unified"
import { visit } from "unist-util-visit"
import path from "path"

const RE_INDEX_FILE = /(?:^|\/)(?:_?index)\.mdx?$/i
const RE_MD_EXT = /\.mdx?$/i

/**
 * Remark Plugin untuk mengubah relative file path (misal: ./file.md)
 * menjadi relative URL (misal: ./file/) yang sesuai dengan Clean URLs Astro.
 */
const remarkRelativePath: Plugin<[], Root> = () => {
  return (tree: Root, file: any) => {
    const currentFile = file.history[0] || ""
    const isCurrentFileIndex = RE_INDEX_FILE.test(currentFile)
    const currentDir = path.posix.dirname(currentFile)

    // Menentukan direktori output build untuk file saat ini.
    // Astro merender post.md menjadi post/index.html (Clean URL),
    // sehingga lokasinya dianggap berada di dalam folder post/.
    let currentDirInBuild = currentDir
    if (!isCurrentFileIndex) {
      const currentFileNameWithoutExt = path.posix
        .basename(currentFile)
        .replace(RE_MD_EXT, "")
      currentDirInBuild = path.posix.join(currentDir, currentFileNameWithoutExt)
    }

    visit(tree, "link", (node: Link, index, parent: any) => {
      if (!parent || index === undefined) return

      const targetUrl = node.url

      // Abaikan jika link eksternal atau hanya anchor internal (#)
      if (/^(?:[a-z]+:|\/\/|#)/i.test(targetUrl)) return

      // 1. Pisahkan Path dari Hash/Query (misal: file.md#intro)
      const [pathPart, ...suffixParts] = targetUrl.split(/([?#])/)
      const suffix = suffixParts.join("")
      if (!pathPart) return

      // 2. Resolusi Path target ke absolut (berdasarkan lokasi file markdown)
      const absoluteTargetFile = path.posix.resolve(currentDir, pathPart)
      const isTargetMarkdown = RE_MD_EXT.test(pathPart)

      let targetPathInBuild: string
      if (isTargetMarkdown) {
        if (RE_INDEX_FILE.test(absoluteTargetFile)) {
          // index.md mengarah ke direktori foldernya
          targetPathInBuild = path.posix.dirname(absoluteTargetFile)
        } else {
          // file.md mengarah ke folder /file/ (Clean URL)
          targetPathInBuild = absoluteTargetFile.replace(RE_MD_EXT, "")
        }
      } else {
        // Asset non-markdown tetap mengarah ke path aslinya
        targetPathInBuild = absoluteTargetFile
      }

      // 3. Hitung relative path dari lokasi build sekarang ke lokasi target build
      let resolvedRelativePath = path.posix.relative(
        currentDirInBuild,
        targetPathInBuild
      )

      if (isTargetMarkdown) {
        if (resolvedRelativePath === "") {
          resolvedRelativePath = "./"
        } else if (!resolvedRelativePath.endsWith("/")) {
          // Pastikan folder Clean URL diakhiri dengan slash
          resolvedRelativePath += "/"
        }
      }

      // 4. Pastikan path valid dengan prefix ./ atau ../
      if (
        resolvedRelativePath !== "" &&
        !resolvedRelativePath.startsWith("../") &&
        !resolvedRelativePath.startsWith("./")
      ) {
        resolvedRelativePath = "./" + resolvedRelativePath
      }

      node.url = resolvedRelativePath + suffix
    })
  }
}

export default remarkRelativePath
