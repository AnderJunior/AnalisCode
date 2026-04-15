import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Plus, X, Loader2, AlertCircle, Search, Trash2, Edit3, Copy
} from 'lucide-react'
import AdminLayout from '../../components/AdminLayout.jsx'
import * as api from '../../services/api.js'

export default function Forms() {
  const navigate = useNavigate()
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.getForms()
      setForms(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!createName.trim()) return
    setCreating(true)
    try {
      const res = await api.createForm({
        name: createName.trim(),
        description: createDesc.trim(),
        schema: { steps: [{ id: 'step1', title: 'Etapa 1', description: '', fields: [] }] }
      })
      setShowCreate(false)
      setCreateName('')
      setCreateDesc('')
      navigate(`/admin/formularios/${res.id}`)
    } catch (err) {
      alert(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.deleteForm(id)
      setDeleteConfirm(null)
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDuplicate = async (form) => {
    try {
      const full = await api.getForm(form.id)
      await api.createForm({
        name: `${form.name} (cópia)`,
        description: form.description,
        schema: full.schema
      })
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  const filtered = forms.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    (f.description || '').toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <AdminLayout title="Formulários">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Formulários</h1>
          <p className="text-sm text-gray-400 mt-1">Crie e gerencie formulários personalizados para seus clientes.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Novo Formulário
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar formulários..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-20 text-red-500 gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FileText className="w-10 h-10 mb-3" />
          <p className="text-sm font-medium text-gray-500">
            {forms.length === 0 ? 'Nenhum formulário cadastrado' : 'Nenhum formulário encontrado'}
          </p>
          {forms.length === 0 && (
            <p className="text-xs mt-1">Clique em "Novo Formulário" para criar</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(form => (
            <div
              key={form.id}
              onClick={() => navigate(`/admin/formularios/${form.id}`)}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDuplicate(form) }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    title="Duplicar"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(form) }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{form.name}</h3>
              {form.description && (
                <p className="text-xs text-gray-400 line-clamp-2 mb-3">{form.description}</p>
              )}
              <p className="text-[10px] text-gray-300">Criado em {formatDate(form.created_at)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                Novo Formulário
              </h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  placeholder="Ex: Briefing Nutricionista"
                  className="input-field"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={createDesc}
                  onChange={e => setCreateDesc(e.target.value)}
                  placeholder="Breve descrição do formulário..."
                  className="input-field"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleCreate} disabled={!createName.trim() || creating} className="btn-primary flex-1 disabled:opacity-50">
                {creating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Criar Formulário'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir formulário?</h3>
            <p className="text-sm text-gray-500 mb-5">
              O formulário <strong>"{deleteConfirm.name}"</strong> será removido. Clientes associados perderão o vínculo.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
