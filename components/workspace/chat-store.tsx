"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { getSeedConversations, type ChatMessage, type Conversation } from "@/lib/data/chat"
import { DEMO_MODE } from "@/lib/demo"
import { CHAT_KEY } from "@/lib/storageKeys"

interface ChatStore {
  conversations: Conversation[]
  /** Update or create a conversation; demo conversations become the user's own once continued. */
  updateConversation: (id: string, update: (messages: ChatMessage[]) => ChatMessage[]) => void
  /** Points spent in this session, on top of the plan's demo usage. */
  spent: number
  spend: (points: number) => void
}

const ChatStoreContext = createContext<ChatStore | null>(null)

/**
 * Chats shared by the workspace sidebar and the Ask AI page. Demo builds keep them in localStorage
 * next to the seeded examples; real builds start empty and never read those chats (the account's
 * conversations come with frontend#10 and #11).
 */
export function ChatStoreProvider({ children }: { children: ReactNode }) {
  const seeds = useMemo(() => (DEMO_MODE ? getSeedConversations() : []), [])
  const [custom, setCustom] = useState<Conversation[]>([])
  const [spent, setSpent] = useState(0)

  useEffect(() => {
    if (!DEMO_MODE) return
    try {
      const stored = window.localStorage.getItem(CHAT_KEY)
      if (stored) setCustom(JSON.parse(stored))
    } catch {
      window.localStorage.removeItem(CHAT_KEY)
    }
  }, [])

  const updateConversation = useCallback(
    (id: string, update: (messages: ChatMessage[]) => ChatMessage[]) => {
      setCustom((prev) => {
        const base = prev.find((c) => c.id === id) ?? seeds.find((c) => c.id === id) ?? { id, messages: [], updatedAt: Date.now() }
        const next: Conversation = { ...base, demo: false, messages: update(base.messages), updatedAt: Date.now() }
        const list = [next, ...prev.filter((c) => c.id !== id)]
        if (DEMO_MODE) window.localStorage.setItem(CHAT_KEY, JSON.stringify(list))
        return list
      })
    },
    [seeds],
  )

  const spend = useCallback((points: number) => setSpent((value) => value + points), [])

  const conversations = useMemo(
    () => [...custom, ...seeds.filter((seed) => !custom.some((c) => c.id === seed.id))].sort((a, b) => b.updatedAt - a.updatedAt),
    [custom, seeds],
  )

  const value = useMemo(() => ({ conversations, updateConversation, spent, spend }), [conversations, updateConversation, spent, spend])
  return <ChatStoreContext.Provider value={value}>{children}</ChatStoreContext.Provider>
}

export function useChatStore() {
  const store = useContext(ChatStoreContext)
  if (!store) throw new Error("useChatStore must be used inside the workspace")
  return store
}
