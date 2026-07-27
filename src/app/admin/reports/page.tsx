import { AdminReportList } from '@/components/admin/AdminReportList'

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Zgłoszenia</h1>
        <p className="text-gray-500">Przeglądaj zgłoszenia użytkowników i podejmuj działania moderacyjne</p>
      </div>
      <AdminReportList />
    </div>
  )
}
