'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { Conversation, Message } from '@/types'

function ChatPageInner() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id)
    })
  }, [supabase])

  const fetchConversations = useCallback(async () => {
    if (!currentUserId) return
    const res = await fetch('/api/conversations')
    const data: Conversation[] = await res.json()
    setConversations(data)

    const preselectId = searchParams.get('conversation')
    if (preselectId) {
      const match = data.find((c) => c.id === preselectId)
      if (match) setSelectedConversation(match)
    }
  }, [currentUserId, searchParams])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const fetchMessages = useCallback(async (conversationId: string) => {
    const res = await fetch(`/api/messages?conversation_id=${conversationId}`)
    const data: Message[] = await res.json()
    setMessages(data)
  }, [])

  useEffect(() => {
    if (!selectedConversation) return
    fetchMessages(selectedConversation.id)

    const channel = supabase
      .channel(`conversation:${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedConversation, fetchMessages, supabase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || isSending) return

    setIsSending(true)
    const content = newMessage.trim()
    setNewMessage('')

    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: selectedConversation.id, content }),
    })

    setIsSending(false)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Wiadomości</h1>
      <div className="grid h-[600px] gap-4 md:grid-cols-[280px_1fr]">
        <Card className="overflow-hidden">
          <div className="flex h-full flex-col">
            <div className="border-b border-gray-200 p-4">
              <p className="font-semibold text-gray-900">Rozmowy</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">Brak rozmów.</p>
              ) : (
                conversations.map((conv) => {
                  const other = conv.other_user
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                        selectedConversation?.id === conv.id ? 'bg-brand-50' : ''
                      }`}
                    >
                      <Avatar name={other?.full_name ?? 'Nieznany'} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {other?.full_name ?? 'Nieznany'}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {conv.last_message?.content ?? 'Brak wiadomości'}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          {!selectedConversation ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              Wybierz rozmowę, aby zacząć czatować
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === currentUserId
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      {!isOwn && <Avatar name={msg.sender?.full_name} size="sm" />}
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                          isOwn
                            ? 'bg-brand-600 text-white rounded-br-none'
                            : 'bg-gray-100 text-gray-900 rounded-bl-none'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-gray-200 p-4">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Napisz wiadomość..."
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <Button type="submit" size="sm" isLoading={isSending} disabled={!newMessage.trim()}>
                    Wyślij
                  </Button>
                </form>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageInner />
    </Suspense>
  )
}
