import { AdminUserList } from '@/components/admin/AdminUserList'

export default function AdminNanniesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nianie</h1>
        <p className="text-gray-500">Przeglądaj i filtruj konta niań</p>
      </div>
      <AdminUserList role="nanny" />
    </div>
  )
}
