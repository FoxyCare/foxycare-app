'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { Button, type ButtonProps } from '@/components/ui/Button'
import { REPORT_REASON_LABEL } from '@/lib/labels'
import { uploadReportAttachment, AttachmentError, MAX_ATTACHMENT_SIZE } from '@/lib/upload/uploadReportAttachment'
import type { ReportReason } from '@/types'

const REASON_OPTIONS = Object.entries(REPORT_REASON_LABEL) as [ReportReason, string][]
const MAX_FILES = 3

// "Zgłoś" — opens a small modal (reason + description + up to 3 evidence
// files, 5 MB each) and submits it via POST /api/reports, then uploads any
// attachments straight to Storage and links them via
// POST /api/reports/[id]/attachments. Used on /nanny/[id] and in the /chat
// header — the two places this app lets you look at a specific other user.
export function ReportUserButton({
  reportedUserId,
  className,
  size,
}: {
  reportedUserId: string
  className?: string
  size?: ButtonProps['size']
}) {
  const router = useRouter()
  const { user } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason>('inappropriate_content')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const open = useCallback(() => {
    if (!user) {
      router.push(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    setIsOpen(true)
  }, [user, router])

  function close() {
    setIsOpen(false)
    setReason('inappropriate_content')
    setDescription('')
    setFiles([])
    setError(null)
    setSubmitted(false)
  }

  function addFiles(newFiles: FileList | null) {
    if (!newFiles || newFiles.length === 0) return
    setError(null)

    const incoming = Array.from(newFiles)
    const combined = [...files, ...incoming]

    if (combined.length > MAX_FILES) {
      setError(`Możesz dodać maksymalnie ${MAX_FILES} załączniki.`)
      return
    }
    const tooLarge = incoming.find((f) => f.size > MAX_ATTACHMENT_SIZE)
    if (tooLarge) {
      setError(`Plik "${tooLarge.name}" jest za duży (maks. 5 MB).`)
      return
    }

    setFiles(combined)
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) {
      setError('Opisz, na czym polega zgłoszenie.')
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reported_id: reportedUserId, reason, description }),
      })
      const report = await res.json()
      if (!res.ok) {
        setError(report.error ?? 'Nie udało się wysłać zgłoszenia')
        return
      }

      if (files.length && user) {
        const supabase = createClient()
        for (const file of files) {
          try {
            const attachment = await uploadReportAttachment(supabase, user.id, report.id, file)
            await fetch(`/api/reports/${report.id}/attachments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(attachment),
            })
          } catch (err) {
            // The report itself already succeeded — a failed attachment
            // shouldn't look like the whole report failed to the user.
            setError(
              err instanceof AttachmentError
                ? err.message
                : `Zgłoszenie wysłane, ale nie udało się dodać pliku "${file.name}".`
            )
          }
        }
      }

      setSubmitted(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button type="button" variant="ghost" size={size} className={className} onClick={open}>
        🚩 Zgłoś
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
            {submitted ? (
              <>
                <h2 className="text-lg font-semibold text-gray-900">Dziękujemy za zgłoszenie</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Nasz zespół przeanalizuje zgłoszenie i podejmie odpowiednie działania.
                </p>
                {error && <p className="mt-2 text-xs text-amber-600">{error}</p>}
                <Button type="button" className="mt-4 w-full" onClick={close}>
                  Zamknij
                </Button>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-gray-900">Zgłoś użytkownika</h2>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Powód zgłoszenia</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as ReportReason)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    {REASON_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Opis zgłoszenia</label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Opisz, co się wydarzyło..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Załączniki <span className="font-normal text-gray-400">(opcjonalnie, do 5 MB każdy)</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      addFiles(e.target.files)
                      e.target.value = ''
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={files.length >= MAX_FILES}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Dodaj załącznik
                  </Button>
                  {files.length > 0 && (
                    <ul className="flex flex-col gap-1">
                      {files.map((file, i) => (
                        <li
                          key={`${file.name}-${i}`}
                          className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-600"
                        >
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="ml-2 shrink-0 text-gray-400 hover:text-red-600"
                          >
                            Usuń
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={close}>
                    Anuluj
                  </Button>
                  <Button type="submit" className="flex-1" isLoading={isSubmitting}>
                    Wyślij zgłoszenie
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
