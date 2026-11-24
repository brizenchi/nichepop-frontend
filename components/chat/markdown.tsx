import { Fragment, type ReactNode } from "react"
import { parseMarkdown } from "@/lib/markdown"
import { cn } from "@/lib/utils"

// Renders the blocks of lib/markdown.ts as React elements: no HTML from the model reaches the page.

const INLINE = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\[[^\]]+\]\([^)\s]+\)|\*[^*\s][^*]*\*)/

function inline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (!part) return null
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      return <strong key={i} className="font-semibold text-foreground">{inline(part.slice(2, -2))}</strong>
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="rounded bg-subtle px-1 py-0.5 text-[0.85em] text-foreground">{part.slice(1, -1)}</code>
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)
    if (link) {
      return /^https?:\/\//.test(link[2]) ? (
        <a key={i} href={link[2]} target="_blank" rel="noreferrer noopener" className="font-medium text-primary underline-offset-2 hover:underline">
          {link[1]}
        </a>
      ) : (
        <Fragment key={i}>{link[1]}</Fragment>
      )
    }
    if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) return <em key={i}>{inline(part.slice(1, -1))}</em>
    return <Fragment key={i}>{part}</Fragment>
  })
}

/** A reply of the analyst, with its Markdown laid out. */
export function Markdown({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("space-y-3 break-words text-sm leading-relaxed text-foreground", className)}>
      {parseMarkdown(text).map((block, i) => {
        switch (block.type) {
          case "heading":
            return (
              <p key={i} role="heading" aria-level={block.level} className={cn("font-semibold text-foreground", block.level <= 2 ? "pt-1 text-base" : "text-sm")}>
                {inline(block.text)}
              </p>
            )
          case "list": {
            const List = block.ordered ? "ol" : "ul"
            return (
              <List key={i} className={cn("space-y-1 pl-5", block.ordered ? "list-decimal" : "list-disc")}>
                {block.items.map((item, j) => (
                  <li key={j}>{inline(item)}</li>
                ))}
              </List>
            )
          }
          case "table":
            return (
              <div key={i} className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-subtle text-left text-muted-foreground">
                    <tr>
                      {block.header.map((cell, j) => (
                        <th key={j} className="px-3 py-2 font-medium">
                          {inline(cell)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {block.rows.map((row, j) => (
                      <tr key={j}>
                        {row.map((cell, k) => (
                          <td key={k} className="px-3 py-2 align-top text-body">
                            {inline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          case "code":
            return (
              <pre key={i} className="overflow-x-auto rounded-lg bg-subtle p-3 text-xs leading-relaxed text-foreground">
                <code>{block.text}</code>
              </pre>
            )
          case "quote":
            return (
              <blockquote key={i} className="whitespace-pre-line border-l-2 border-border pl-3 text-body">
                {inline(block.text)}
              </blockquote>
            )
          case "rule":
            return <hr key={i} className="border-border" />
          default:
            return (
              <p key={i} className="whitespace-pre-line">
                {inline(block.text)}
              </p>
            )
        }
      })}
    </div>
  )
}
