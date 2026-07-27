'use client'

import { useCallback, useEffect, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { REPORT_REASON_LABEL, REPORT_STATUS_LABEL } from '@/lib/labels'
import type { AdminReportRow, ReportStatus } from '@/types'

const STATUS_FILTERS: (ReportStatus | 'all')[] = ['pending', 'resolved', 'dismissed', 'all']
const STATUS_BADGE_VARIANT: Record<ReportStatus, 'warning' | 'success' | 'default'> = {
  pending: 'warning',
  resolved: 'success',
  dismissed: 'default',
}

export function AdminReportList() {
  const [reports, setReports] = useState<AdminReportRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('pending')
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    setIsLoading(true)
    const params = statusFilter === 'all' ? '' : `?status=${statusFilter}`
    const res = await fetch(`/api/admin/reports${params}`)
    const data = await res.json()
    setReports(res.ok ? data : [])
    setIsLoading(false)
  }, [statusFilter])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  async function resolve(report: AdminReportRow) {
    setPendingAction(`resolve-${report.id}`)
    const res = await fetch(`/api/admin/reports/${report.id}/resolve`, { method: 'POST' })
    if (res.ok) {
      setReports((prev) => prev.map((r) => (r.id === report.id ? { ...r, status: 'resolved' } : r)))
    } else {
      alert((await res.json()).error ?? 'Nie udało się zaktualizować zgłoszenia')
    }
    setPendingAction(null)
  }

  async function dismiss(report: AdminReportRow) {
    setPendingAction(`dismiss-${report.id}`)
    const res = await fetch(`/api/admin/reports/${report.id}/dismiss`, { method: 'POST' })
    if (res.ok) {
      setReports((prev) => prev.map((r) => (r.id === report.id ? { ...r, status: 'dismissed' } : r)))
    } else {
      alert((await res.json()).error ?? 'Nie udało się zaktualizować zgłoszenia')
    }
    setPendingAction(null)
  }

  async function banReported(report: AdminReportRow) {
    if (!report.reported || report.reported.is_banned) return
    if (!window.confirm(`Zbanować użytkownika ${report.reported.full_name}? Nie będzie mógł się zalogować.`)) {
      return
    }
    setPendingAction(`ban-${report.id}`)
    const res = await fetch(`/api/admin/users/${report.reported.id}/ban`, { method: 'POST' })
    if (res.ok) {
      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id && r.reported ? { ...r, reported: { ...r.reported, is_banned: true } } : r
        )
      )
    } else {
      alert((await res.json()).error ?? 'Nie udało się zbanować użytkownika')
    }
    setPendingAction(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap gap-2 pt-6">
          {STATUS_FILTERS.map((status) => (
            <Button
              key={status}
              type="button"
              size="sm"
              variant={statusFilter === status ? 'primary' : 'outline'}
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'Wszystkie' : REPORT_STATUS_LABEL[status]}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-sm text-gray-500">Ładowanie…</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-gray-500">Brak zgłoszeń.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {reports.map((report) => (
                <div key={report.id} className="flex flex-col gap-3 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Zgłaszający:</span>
                      <span className="font-medium text-gray-900">
                        {report.reporter?.full_name ?? '(usunięte konto)'}
                      </span>
                      <span className="text-gray-400">→</span>
                      {report.reported && (
                        <div className="flex items-center gap-1.5">
                          <Avatar name={report.reported.full_name} size="sm" />
                          <span className="font-medium text-gray-900">{report.reported.full_name}</span>
                          {report.reported.is_banned && <Badge variant="danger">Zbanowany</Badge>}
                        </div>
                      )}
                      {!report.reported && <span className="text-gray-500">(usunięte konto)</span>}
                    </div>
                    <Badge variant={STATUS_BADGE_VARIANT[report.status]}>
                      {REPORT_STATUS_LABEL[report.status]}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="info">{REPORT_REASON_LABEL[report.reason]}</Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(report.created_at).toLocaleString('pl-PL')}
                    </span>
                  </div>

                  <p className="whitespace-pre-line text-sm text-gray-700">{report.description}</p>

                  {report.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {report.attachments.map((a) =>
                        a.url ? (
                          <a
                            key={a.id}
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-brand-600 hover:underline"
                          >
                            📎 {a.file_name}
                          </a>
                        ) : (
                          <span
                            key={a.id}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-400"
                          >
                            📎 {a.file_name} (niedostępny)
                          </span>
                        )
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {report.reported && !report.reported.is_banned && (
                      <Button
                        variant="danger"
                        size="sm"
                        isLoading={pendingAction === `ban-${report.id}`}
                        onClick={() => banReported(report)}
                      >
                        Zbanuj użytkownika
                      </Button>
                    )}
                    {report.status !== 'resolved' && (
                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={pendingAction === `resolve-${report.id}`}
                        onClick={() => resolve(report)}
                      >
                        Oznacz jako rozwiązane
                      </Button>
                    )}
                    {report.status !== 'dismissed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        isLoading={pendingAction === `dismiss-${report.id}`}
                        onClick={() => dismiss(report)}
                      >
                        Odrzuć
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
