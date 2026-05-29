import type { Root, Text } from "mdast"
import type { Plugin } from "unified"

import { generateId, slugger } from "../utils/generate-id"
import { globSorted } from "../utils/glob-sorted"
import { relURL } from "../utils/resolve-url"
import { visit } from "unist-util-visit"
import path from "path"

/**
 * Regex untuk mendeteksi Wiki Link: ![[target#anchor|alias]]
 * Grup 1: ! (untuk embed)
 * Grup 2: target (nama file atau path)
 * Grup 3: anchor (heading)
 * Grup 4: alias atau size (misal: 200x300)
 */
const RE_WIKI = /(!)?\[\[(.*?)(?:#(.*?))?(?:\|(.*?))?\]\]/g

const IMAGE_EXTS = new Set([
  ".avif",
  ".bmp",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
])
const AUDIO_EXTS = new Set([
  ".flac",
  ".m4a",
  ".mp3",
  ".ogg",
  ".wav",
  ".webm",
  ".3gp",
])
const VIDEO_EXTS = new Set([".mkv", ".mov", ".mp4", ".ogv", ".webm"])

export interface RemarkWikiLinkOptions {
  assetAlias?: string
  contentDir?: string
  assetDir?: string
}

const { DEV } = import.meta.env
let cachedEntries: Map<string, string> | null = null

/**
 * Mengambil daftar semua file (konten & asset) dan memetakan ke URL/Alias.
 * Digunakan untuk resolusi link wiki yang fleksibel.
 */
function getFileEntries(opt: {
  contentDir: string
  assetDir: string
  assetAlias: string
}) {
  if (!DEV && cachedEntries) return cachedEntries

  const map = new Map<string, string>()

  // 1. Map Konten (Markdown)
  const contentEntries = globSorted("**/*.{md,mdx}", { cwd: opt.contentDir })
  for (const entry of contentEntries) {
    const fileName = path.posix.basename(entry)
    const url = relURL(generateId(entry))
    const finalURL = url.endsWith("/") ? url : url + "/"

    const fullId = generateId(entry)
    const shortId = generateId(fileName)

    if (!map.has(fullId)) map.set(fullId, finalURL)
    if (!map.has(shortId)) map.set(shortId, finalURL)
  }

  // 2. Map Assets (Gambar, Audio, Video, dll)
  const assetsEntries = globSorted("**/*", { cwd: opt.assetDir })
  for (const entry of assetsEntries) {
    const ext = path.posix.extname(entry).toLowerCase()
    const fileName = path.posix.basename(entry)

    if (IMAGE_EXTS.has(ext)) {
      const alias = opt.assetAlias.endsWith("/")
        ? opt.assetAlias
        : opt.assetAlias + "/"
      const pathAlias = alias + entry
      if (!map.has(fileName)) map.set(fileName, pathAlias)
      if (!map.has(entry)) map.set(entry, pathAlias)
    } else {
      const url = relURL(entry)
      if (!map.has(fileName)) map.set(fileName, url)
      if (!map.has(entry)) map.set(entry, url)
    }
  }

  if (!DEV) cachedEntries = map
  return map
}

/**
 * Handler untuk mengubah Wiki Link (Embed) ![[...]] menjadi node gambar atau HTML.
 */
function handleEmbed(
  target: string,
  resolvedPath: string | undefined,
  alias: string | undefined
) {
  const ext = path.posix.extname(target).toLowerCase()
  const url = resolvedPath || target

  if (IMAGE_EXTS.has(ext)) {
    const isSize = alias && /^\d+(x\d+)?$/.test(alias)
    const [width, height] = isSize ? alias.split("x") : [undefined, undefined]
    return {
      type: "image",
      url: url,
      title: alias || target,
      alt: alias || target,
      data: {
        hProperties: {
          width: width || undefined,
          height: height || undefined,
          className: "wiki-embed-image",
        },
      },
    }
  }

  if (AUDIO_EXTS.has(ext)) {
    return {
      type: "html",
      value: `<audio src="${url}" controls class="wiki-embed-audio"></audio>`,
    }
  }

  if (VIDEO_EXTS.has(ext)) {
    return {
      type: "html",
      value: `<video src="${url}" controls class="wiki-embed-video"></video>`,
    }
  }

  if (ext === ".pdf") {
    return {
      type: "html",
      value: `<iframe src="${url}" class="wiki-embed-pdf" width="100%" height="500px"></iframe>`,
    }
  }

  return null
}

/**
 * Handler untuk mengubah Wiki Link [[...]] menjadi node link markdown.
 */
function handleLink(
  target: string,
  resolvedPath: string | undefined,
  anchor: string | undefined,
  alias: string | undefined
) {
  let url = resolvedPath || ""
  if (anchor) url += `#${generateId(anchor)}`
  if (!target && anchor) url = `#${generateId(anchor)}`

  const displayValue =
    alias ||
    (target && anchor ? `${target} > ${anchor}` : target || anchor || "")
  const isBroken = target && !resolvedPath

  if (isBroken) console.warn(`- ⚠️ Wiki Link tidak ditemukan: ${target}`)

  return {
    type: "link",
    url: url || "#",
    title: resolvedPath || target || undefined,
    data: {
      hName: isBroken ? "span" : "a",
      hProperties: { className: isBroken ? "broken-link" : "internal-link" },
    },
    children: [{ type: "text", value: displayValue }],
  }
}

/**
 * Plugin Remark untuk memproses Wiki Links dengan sintaks:
 * [[Target]] atau ![[Embed]]
 */
const remarkWikiLink: Plugin<[RemarkWikiLinkOptions?], Root> = (
  options = {}
) => {
  const {
    assetAlias = "@assets",
    contentDir = "src/content",
    assetDir = "src/assets",
  } = options

  const files = getFileEntries({ assetAlias, contentDir, assetDir })

  return (tree: Root) => {
    visit(tree, "text", (node: Text, index, parent: any) => {
      if (!parent || index === undefined) return

      const matches = Array.from(node.value.matchAll(RE_WIKI))
      if (matches.length === 0) return

      const nodes: any[] = []
      let lastIndex = 0

      for (const match of matches) {
        const [fullMatch, isEmbed, targetRaw, anchor, alias] = match
        const target = targetRaw?.trim() || ""
        const matchStart = match.index!

        // Masukkan teks sebelum match
        if (matchStart > lastIndex) {
          nodes.push({
            type: "text",
            value: node.value.slice(lastIndex, matchStart),
          })
        }

        // Resolusi Path
        const targetId = generateId(target)
        const sluggedTarget = slugger(target)
        const resolvedPath =
          files.get(target) || files.get(targetId) || files.get(sluggedTarget)

        // Transformasi ke node baru
        let newNode: any = null
        if (isEmbed) {
          newNode = handleEmbed(target, resolvedPath, alias)
        } else {
          newNode = handleLink(target, resolvedPath, anchor, alias)
        }

        if (newNode) nodes.push(newNode)
        lastIndex = matchStart + fullMatch.length
      }

      // Masukkan sisa teks setelah match terakhir
      if (lastIndex < node.value.length) {
        nodes.push({ type: "text", value: node.value.slice(lastIndex) })
      }

      // Ganti node teks asli dengan node-node baru hasil transformasi
      parent.children.splice(index, 1, ...nodes)
    })
  }
}

export default remarkWikiLink
