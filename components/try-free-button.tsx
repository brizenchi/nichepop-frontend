"use client"

import Link from "next/link"
import { type ComponentProps } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"

interface TryFreeButtonProps extends Omit<ComponentProps<typeof Button>, "asChild"> {
  authenticatedHref?: string
  guestHref?: string
}

export function TryFreeButton({
  authenticatedHref = "/dashboard",
  guestHref = "/dashboard#project-intake",
  children,
  ...buttonProps
}: TryFreeButtonProps) {
  const { isAuthenticated } = useAuth()
  const href = isAuthenticated ? authenticatedHref : guestHref

  return (
    <Button asChild {...buttonProps}>
      <Link href={href}>{children}</Link>
    </Button>
  )
}
