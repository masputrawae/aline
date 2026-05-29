/**
 * PATH: src/utils/glob-shorted.ts
 */

import FastGlob, { type Options, type Pattern } from "fast-glob"

export function globSorted(pattern: Pattern, options: Options) {
  return FastGlob.sync(pattern, options).sort((a, b) => {
    const depthA = a.split("/").length
    const depthB = b.split("/").length
    if (depthA !== depthB) return depthA - depthB
    return a.localeCompare(b)
  })
}
