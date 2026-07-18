'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { Conversation, Message, Profile } from '@/types'

export default function ChatPage() {
  const supabase = createClient()
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUser({ id: data.user.id })
    })
  }, [supabase])

  // Load conversations
  const fetchConversations = useCallback(async () => {
    if (!currentUser) return
    const { data } = await supabase
      .from('conversations')
      .select(`
        *,
        messages(id, content, created_at, sender_id)
      `)
      .contains('participant_ids', [currentUser.id])
      .order('updated_at', { ascending: false })

    setConversations((data as unknown as Conversation[]) ?? [])
  }, [currentUser, supabase])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Load messages for selected conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(*)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    setMessages((data as unknown as Message[]) ?? [])
  }, [supabase])

  useEffect(() => {
    if (!selectedConversation) return
    fetchMessages(selectedConversation.id)

    // Subscribe to realtime messages
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

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || !currentUser || isSending)
      return

    setIsSending(true)
    const content = newMessage.trim()
    setNewMessage('')

    await supabase.from('messages').insert({
      conversation_id: selectedConversation.id,
      sender_id: currentUser.id,
      content,
    })

    // Update conversation updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', selectedConversation.id)

    setIsSending(false)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
      <div className="grid h-[600px] gap-4 md:grid-cols-[280px_1fr]">
        {/* Conversation list */}
        <Card className="overflow-hidden">
          <div className="flex h-full flex-col">
            <div className="border-b border-gray-200 p-4">
              <p className="font-semibold text-gray-900">Conversations</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">No conversations yet.</p>
              ) : (
                conversations.map((conv) => {
                  const other = conv.other_participant
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                        selectedConversation?.id === conv.id
                          ? 'bg-indigo-50'
                          : ''
                      }`}
                    >
                      <Avatar
                        src={(other as Profile)?.avatar_url}
                        name={(other as Profile)?.full_name ?? 'Unknown'}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {(other as Profile)?.full_name ?? 'Unknown'}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {conv.last_message?.content ?? 'No messages yet'}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </Card>

        {/* Message area */}
        <Card className="overflow-hidden">
          {!selectedConversation ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              Select a conversation to start chatting
            </div>
          ) : (
            <div className="flex h-full flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === currentUser?.id
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      {!isOwn && (
                        <Avatar
                          src={(msg.sender as Profile)?.avatar_url}
                          name={(msg.sender as Profile)?.full_name}
                          size="sm"
                        />
                      )}
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                          isOwn
                            ? 'bg-indigo-600 text-white rounded-br-none'
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

              {/* Input */}
              <div className="border-t border-gray-200 p-4">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    isLoading={isSending}
                    disabled={!newMessage.trim()}
                  >
                    Send
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
