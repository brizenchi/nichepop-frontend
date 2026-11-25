// The analyst writes Markdown. Its blocks: headings, lists, tables, code, quotes and paragraphs;
// components/chat/markdown.tsx renders them with bold, code and links inside.

export type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; header: string[]; rows: string[][] }
  | { type: "code"; text: string }
  | { type: "quote"; text: string }
  | { type: "rule" }
  | { type: "paragraph"; text: string }

const LIST_ITEM = /^\s*([-*+]|\d+[.)])\s+(.*)$/
const TABLE_RULE = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim())

export function parseMarkdown(text: string): MarkdownBlock[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n")
  const blocks: MarkdownBlock[] = []
  let paragraph: string[] = []
  const flush = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", text: paragraph.join("\n") })
    paragraph = []
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) {
      flush()
      continue
    }
    if (line.trim().startsWith("```")) {
      flush()
      const code: string[] = []
      while (++i < lines.length && !lines[i].trim().startsWith("```")) code.push(lines[i])
      blocks.push({ type: "code", text: code.join("\n") })
      continue
    }
    const heading = line.match(/^\s*(#{1,6})\s+(.*)$/)
    if (heading) {
      flush()
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2].replace(/\s+#+\s*$/, "") })
      continue
    }
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flush()
      blocks.push({ type: "rule" })
      continue
    }
    if (line.trim().startsWith("|") && i + 1 < lines.length && TABLE_RULE.test(lines[i + 1])) {
      flush()
      const header = cells(line)
      const rows: string[][] = []
      i++
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith("|")) rows.push(cells(lines[++i]))
      blocks.push({ type: "table", header, rows })
      continue
    }
    const item = line.match(LIST_ITEM)
    if (item) {
      flush()
      const ordered = /\d/.test(item[1])
      const last = blocks[blocks.length - 1]
      if (last?.type === "list" && last.ordered === ordered) last.items.push(item[2])
      else blocks.push({ type: "list", ordered, items: [item[2]] })
      continue
    }
    const last = blocks[blocks.length - 1]
    // An indented line goes on with the list item above it.
    if (!paragraph.length && last?.type === "list" && /^\s{2,}/.test(line)) {
      last.items[last.items.length - 1] += ` ${line.trim()}`
      continue
    }
    if (line.trim().startsWith(">")) {
      flush()
      const quote = line.trim().replace(/^>\s?/, "")
      const previous = blocks[blocks.length - 1]
      if (previous?.type === "quote") previous.text += `\n${quote}`
      else blocks.push({ type: "quote", text: quote })
      continue
    }
    paragraph.push(line.trim())
  }
  flush()
  return blocks
}
