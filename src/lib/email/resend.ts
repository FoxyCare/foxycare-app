// Direct fetch to Resend's API rather than pulling in their SDK for one
// call — same credentials already configured as Supabase Auth's SMTP relay
// (see the Supabase Auth email templates), just used here for e-mails this
// app triggers itself instead of ones GoTrue sends on its own.
const FROM = 'FoxyCare <support@foxycare.pl>'

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.error('[email] RESEND_API_KEY not set — skipped sending to', to)
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  })

  if (!res.ok) {
    console.error('[email] Resend send failed:', res.status, await res.text())
  }
}
