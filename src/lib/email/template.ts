// Shared HTML shell for every FoxyCare-branded transactional e-mail.
//
// Two different senders end up using this same function:
//   1. Supabase Auth's own e-mails (password reset, signup confirmation).
//      GoTrue can't call back into this app to render these at send time,
//      so there's no live "template" on that side — instead this function
//      is run once (via the generate-auth-emails script) to produce a
//      static HTML string that gets pasted into the Supabase Auth config
//      (mailer_templates_recovery_content etc.). GoTrue's own
//      `{{ .ConfirmationURL }}`-style placeholders are passed straight
//      through untouched in ctaUrl/bodyHtml — this function doesn't know
//      or care about them.
//   2. Future e-mails this app sends itself via Resend's API at runtime
//      (e.g. "you have a new message" notifications) — those import and
//      call this function directly, same as any other app code.
//
// Table-based layout with inline styles throughout: email clients (Outlook
// most of all) don't reliably support modern CSS, flexbox, or <style>
// blocks the way browsers do.

// www. and not the bare domain — foxycare.pl 308-redirects to www., and
// not every mail client's image proxy follows redirects for embedded images.
const LOGO_URL = 'https://www.foxycare.pl/logo-email.png'

// brand-600 / brand-700 from tailwind.config.ts — kept as literal hex here
// since e-mail HTML can't reach into the app's Tailwind config at render
// time, in either of the two call sites described above.
const COLORS = {
  cream: '#FDF3EA',
  brand600: '#C86A2E',
  brand700: '#B13801',
  text: '#374151', // gray-700
  textMuted: '#9CA3AF', // gray-400
  border: '#F3E2D3', // ~brand-100, used for hairline borders on cream
}

// E-mail HTML is built with template strings, not JSX — anything sourced
// from user-editable data (a display name, a message preview) needs this
// before interpolation, same reason JSX auto-escapes text children.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export interface BrandedEmailOptions {
  /** Shown in some inbox previews before the e-mail is opened. */
  previewText: string
  heading: string
  /** One or more already-safe <p>...</p> blocks. */
  bodyHtml: string
  ctaLabel?: string
  ctaUrl?: string
}

export function renderBrandedEmail({
  previewText,
  heading,
  bodyHtml,
  ctaLabel,
  ctaUrl,
}: BrandedEmailOptions): string {
  const cta =
    ctaLabel && ctaUrl
      ? `
        <tr>
          <td align="center" style="padding:8px 0 4px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="border-radius:8px;background-color:${COLORS.brand600};">
                  <a href="${ctaUrl}" target="_blank"
                     style="display:inline-block;padding:12px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">
                    ${ctaLabel}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
      : ''

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.cream};font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${previewText}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.cream};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <img src="${LOGO_URL}" width="72" height="59" alt="FoxyCare"
                   style="display:block;border:0;outline:none;" />
              <div style="margin-top:6px;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;color:${COLORS.brand700};letter-spacing:0.2px;">
                FoxyCare
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;border:1px solid ${COLORS.border};border-radius:16px;padding:36px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:16px;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:bold;color:${COLORS.brand700};">
                    ${heading}
                  </td>
                </tr>
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${COLORS.text};">
                    ${bodyHtml}
                  </td>
                </tr>
                ${cta}
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:${COLORS.textMuted};">
              Ta wiadomość została wysłana automatycznie przez FoxyCare.<br />
              &copy; ${new Date().getFullYear()} FoxyCare
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
