import type { SupabaseClient } from '@supabase/supabase-js'
import { escapeHtml, renderBrandedEmail } from './template'
import { sendEmail } from './resend'

// Called (via next/server's after(), so it never delays the sender's own
// response) once a message insert succeeds. Deliberately does NOT include
// the message content in the e-mail — FoxyCare chat can carry addresses,
// schedules, and children's names, and an e-mail is more likely to end up
// forwarded or read over someone's shoulder than the app itself.
export async function notifyNewMessage({
  supabase,
  conversationId,
  messageId,
  senderName,
  receiverId,
  origin,
}: {
  supabase: SupabaseClient
  conversationId: string
  messageId: string
  senderName: string
  receiverId: string
  origin: string
}): Promise<void> {
  // Throttle: a conversation has exactly two participants, so if the
  // message immediately before this one was NOT sent by the receiver, it
  // must have been sent by the same sender as this one — i.e. this is a
  // rapid burst, and the receiver was already notified for the first
  // message in it. Only the message that turns a conversation from
  // "receiver spoke last" (or empty) into "sender spoke last" is worth a
  // new e-mail.
  const { data: previous } = await supabase
    .from('messages')
    .select('sender_id')
    .eq('conversation_id', conversationId)
    .neq('id', messageId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (previous && previous.sender_id !== receiverId) {
    return
  }

  const { data: receiver } = await supabase
    .from('users')
    .select('email')
    .eq('id', receiverId)
    .single()

  if (!receiver?.email) {
    return
  }

  const safeName = escapeHtml(senderName)

  const html = renderBrandedEmail({
    previewText: `${senderName} wysłał(a) Ci nową wiadomość`,
    heading: 'Masz nową wiadomość',
    bodyHtml: `<p style="margin:0;">${safeName} wysłał(a) Ci nową wiadomość w FoxyCare.</p>`,
    ctaLabel: 'Przejdź do rozmowy',
    ctaUrl: `${origin}/chat?conversation=${conversationId}`,
  })

  await sendEmail({
    to: receiver.email,
    subject: `Nowa wiadomość od ${senderName} w FoxyCare`,
    html,
  })
}
