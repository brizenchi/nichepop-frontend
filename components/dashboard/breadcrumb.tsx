"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

const routeNames: Record<string, string> = {
  dashboard: "Reddit Marketing",
  ideas: "Ideas DB",
  validate: "Idea Analysis",
  monitor: "Reddit Panel",
}

export function DashboardBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length <= 1) return null

  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/")
    const label = routeNames[segment] || segment
    const isLast = index === segments.length - 1

    return { href, label, isLast }
  })

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-1.5 text-sm" itemScope itemType="https://schema.org/BreadcrumbList">
        {crumbs.map((crumb, index) => (
          <li
            key={crumb.href}
            className="flex items-center gap-1.5"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-[#B3A8C8]" />}
            {crumb.isLast ? (
              <span className="font-medium text-[#111111]" itemProp="name">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-[#7D7590] transition-colors hover:text-[#111111]"
                itemProp="item"
              >
                <span itemProp="name">{crumb.label}</span>
              </Link>
            )}
            <meta itemProp="position" content={String(index + 1)} />
          </li>
        ))}
      </ol>
    </nav>
  )
}
