import { ClipboardList } from 'lucide-react'
import AdminLayout from '../../components/AdminLayout.jsx'

export default function Workspace() {
  return (
    <AdminLayout title="Workspace">
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <ClipboardList className="w-12 h-12 mb-4 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-500 mb-1">Workspace</h2>
        <p className="text-sm">Em breve: gerencie suas tarefas aqui.</p>
      </div>
    </AdminLayout>
  )
}
