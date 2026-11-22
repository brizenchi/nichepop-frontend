import { redirect } from "next/navigation"

/** The old Google sign-in landing; the API now sends readers to /login (auth.frontend_redirect). */
export default async function AuthCallbackPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) query.append(key, item)
  }
  const search = query.toString()
  redirect(search ? `/login?${search}` : "/login")
}
