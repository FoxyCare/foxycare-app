import { AdminUserList } from '@/components/admin/AdminUserList'

export default function AdminParentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rodzice</h1>
        <p className="text-gray-500">Przeglądaj i filtruj konta rodziców</p>
      </div>
      <AdminUserList role="parent" />
    </div>
  )
}
