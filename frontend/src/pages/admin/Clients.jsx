import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Plus, X, Copy, Check, ChevronRight,
  Loader2, AlertCircle, UserPlus, Search, Trash2,
  List, LayoutGrid, GripVertical, Clock, Eye, EyeOff
} from 'lucide-react'
import { DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import AdminLayout from '../../components/AdminLayout.jsx'
import * as api from '../../services/api.js'

const STATUS_CONFIG = {
  formulario_pendente:   { label: 'Formulário Pendente',   dot: 'bg-gray-400' },
  formulario_preenchido: { label: 'Formulário Preenchido', dot: 'bg-gray-500' },
  em_edicao:             { label: 'Em Edição',             dot: 'bg-gray-600' },
  aguardando_aprovacao:  { label: 'Aguardando Aprovação',  dot: 'bg-gray-700' },
  alteracao_solicitada:  { label: 'Alteração Solicitada',  dot: 'bg-primary-600' },
  aprovado:              { label: 'Aprovado',              dot: 'bg-gray-800' },
  publicado:             { label: 'Publicado',             dot: 'bg-gray-900' },
}

const KANBAN_COLUMNS = [
  { key: 'formulario_pendente',   label: 'Form. Pendente',   color: 'bg-gray-400',    headerBg: 'bg-gray-50' },
  { key: 'formulario_preenchido', label: 'Form. Preenchido', color: 'bg-blue-500',    headerBg: 'bg-blue-50' },
  { key: 'em_edicao',             label: 'Em Edição',        color: 'bg-indigo-500',  headerBg: 'bg-indigo-50' },
  { key: 'aguardando_aprovacao',  label: 'Aguard. Aprovação',color: 'bg-amber-500',   headerBg: 'bg-amber-50' },
  { key: 'alteracao_solicitada',  label: 'Alter. Solicitada',color: 'bg-orange-500',  headerBg: 'bg-orange-50' },
  { key: 'aprovado',              label: 'Aprovado',         color: 'bg-green-500',   headerBg: 'bg-green-50' },
  { key: 'publicado',             label: 'Entregue',         color: 'bg-emerald-600', headerBg: 'bg-emerald-50' },
]

function getDaysInStage(createdAt) {
  if (!createdAt) return 0
  const diff = Date.now() - new Date(createdAt).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

// ---- Kanban Components ----

function KanbanCard({ client, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `client-${client.id}`,
    data: { client },
  })

  const style = transform ? {
    transform: `translate(${transform.x}px, ${transform.y}px)`,
  } : undefined

  const days = getDaysInStage(client.updated_at || client.created_at)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md group ${
        isDragging ? 'opacity-50 shadow-lg ring-2 ring-primary-200' : ''
      }`}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1" onClick={(e) => { e.stopPropagation(); onClick() }}>
          <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary-700 cursor-pointer">{client.name}</p>
          {client.email && <p className="text-xs text-gray-400 truncate mt-0.5">{client.email}</p>}
        </div>
        <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
      </div>
      {client.form_opened_at && (
        <div className="flex items-center gap-1 mt-2 px-2 py-1 bg-green-50 rounded-md">
          <Eye className="w-3 h-3 text-green-500" />
          <span className="text-[10px] text-green-600 font-medium">Link aberto</span>
        </div>
      )}
      {!client.form_opened_at && client.status === 'formulario_pendente' && (
        <div className="flex items-center gap-1 mt-2 px-2 py-1 bg-gray-50 rounded-md">
          <EyeOff className="w-3 h-3 text-gray-400" />
          <span className="text-[10px] text-gray-400 font-medium">Não abriu o link</span>
        </div>
      )}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-50">
        <span className="text-[10px] text-gray-400 font-medium">{client.template_name || '—'}</span>
        <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
          <Clock className="w-3 h-3" />
          {days === 0 ? 'Hoje' : `${days} dia${days > 1 ? 's' : ''}`}
        </span>
      </div>
    </div>
  )
}

function KanbanCardOverlay({ client }) {
  const days = getDaysInStage(client.updated_at || client.created_at)
  return (
    <div className="bg-white rounded-xl border-2 border-primary-300 shadow-2xl p-3.5 w-[250px] rotate-2">
      <p className="text-sm font-semibold text-gray-900 truncate">{client.name}</p>
      {client.email && <p className="text-xs text-gray-400 truncate mt-0.5">{client.email}</p>}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-50">
        <span className="text-[10px] text-gray-400 font-medium">{client.template_name || '—'}</span>
        <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
          <Clock className="w-3 h-3" />
          {days === 0 ? 'Hoje' : `${days} dia${days > 1 ? 's' : ''}`}
        </span>
      </div>
    </div>
  )
}

function KanbanColumn({ column, clients, onCardClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key })
  const count = clients.length

  return (
    <div className="flex-shrink-0 w-[260px] flex flex-col bg-gray-50/80 rounded-xl border border-gray-100">
      {/* Column header */}
      <div className={`px-4 py-3 rounded-t-xl ${column.headerBg} border-b border-gray-100`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${column.color}`} />
            <span className="text-xs font-bold text-gray-700">{column.label}</span>
          </div>
          <span className="text-[10px] font-bold text-gray-400 bg-white/80 px-2 py-0.5 rounded-full">{count}</span>
        </div>
      </div>

      {/* Cards container */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-2 space-y-2 overflow-y-auto min-h-[120px] transition-colors rounded-b-xl ${
          isOver ? 'bg-primary-50/50 ring-2 ring-inset ring-primary-200' : ''
        }`}
        style={{ maxHeight: 'calc(100vh - 260px)' }}
      >
        {count === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[80px]">
            <p className="text-[11px] text-gray-300 italic">Nenhum cliente nesta etapa</p>
          </div>
        ) : (
          clients.map((client) => (
            <KanbanCard
              key={client.id}
              client={client}
              onClick={() => onCardClick(client.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function KanbanBoard({ clients, setClients, onCardClick }) {
  const [activeClient, setActiveClient] = useState(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragStart = (event) => {
    const client = event.active.data.current?.client
    if (client) setActiveClient(client)
  }

  const handleDragEnd = async (event) => {
    setActiveClient(null)
    const { active, over } = event
    if (!over) return

    const client = active.data.current?.client
    const newStatus = over.id
    if (!client || client.status === newStatus) return

    // Optimistic update
    const oldClients = [...clients]
    setClients(prev => prev.map(c => c.id === client.id ? { ...c, status: newStatus, updated_at: new Date().toISOString() } : c))

    try {
      await api.updateStatus(client.id, newStatus)
    } catch (err) {
      // Revert on error
      setClients(oldClients)
      alert('Erro ao atualizar status: ' + (err.message || 'Tente novamente'))
    }
  }

  const handleDragCancel = () => setActiveClient(null)

  // Group clients by status
  const grouped = {}
  KANBAN_COLUMNS.forEach(col => { grouped[col.key] = [] })
  clients.forEach(client => {
    const key = client.status || 'formulario_pendente'
    if (grouped[key]) grouped[key].push(client)
    else grouped['formulario_pendente'].push(client)
  })

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
      <div className="flex gap-3 overflow-x-auto pb-4 px-1" style={{ minHeight: 'calc(100vh - 220px)' }}>
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.key}
            column={col}
            clients={grouped[col.key]}
            onCardClick={onCardClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeClient ? <KanbanCardOverlay client={activeClient} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, dot: 'bg-gray-400' }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
      {config.label}
    </span>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handle = async (e) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handle}
      title="Copiar link do formulário"
      className="p-1.5 rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-gray-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function CreateClientModal({ onClose, onSuccess }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getTemplates()
      .then((d) => {
        setTemplates(d.templates || [])
        if (d.templates?.length) setTemplateId(String(d.templates[0].id))
      })
      .catch(() => setError('Erro ao carregar templates'))
      .finally(() => setTemplatesLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Nome é obrigatório'); return }
    if (!templateId) { setError('Selecione um template'); return }
    setError('')
    setLoading(true)
    try {
      const data = await api.createClient({ name, email, phone, template_id: parseInt(templateId) })
      onSuccess(data.client)
    } catch (err) {
      setError(err.message || 'Erro ao criar cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-3.5 h-3.5 text-gray-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Novo Cliente</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Nome *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Nome do cliente" className="input-field text-sm" disabled={loading} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com" className="input-field text-sm" disabled={loading} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Telefone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999" className="input-field text-sm" disabled={loading} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Template *</label>
            {templatesLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2].map(i => <div key={i} className="aspect-[16/10] bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => !loading && setTemplateId(String(t.id))}
                    className={`cursor-pointer rounded-xl border-2 overflow-hidden transition-all ${
                      templateId === String(t.id)
                        ? 'border-primary-600 ring-2 ring-primary-100 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                      <img
                        src={t.thumbnail || `/templates/${t.slug}/thumbnail.png`}
                        alt={t.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    </div>
                    <div className="px-3 py-2 bg-white">
                      <p className="font-medium text-sm text-gray-900 truncate">{t.name}</p>
                      {t.niche && <p className="text-xs text-gray-500">{t.niche}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <p className="text-red-600 text-xs">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center text-sm" disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1 justify-center text-sm" disabled={loading}>
              {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Criando...</> : 'Criar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Clients() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [viewMode, setViewMode] = useState('kanban')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getClients()
      setClients(data.clients || [])
    } catch (err) {
      setError(err.message || 'Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = clients.filter((c) =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (client) => {
    setDeleting(true)
    try {
      await api.deleteClient(client.id)
      setClients(prev => prev.filter(c => c.id !== client.id))
      setDeleteConfirm(null)
    } catch (err) {
      alert('Erro ao excluir: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

  return (
    <AdminLayout title="Clientes">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">
            {loading ? '' : `${filtered.length} cliente${filtered.length !== 1 ? 's' : ''}`}
          </p>
          <div className="flex items-center gap-3">
            <div className="relative w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              />
            </div>
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                title="Visualização em lista"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                title="Visualização Kanban"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
              <Plus className="w-4 h-4" />
              Novo Cliente
            </button>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'kanban' && !loading && !error ? (
          <div className="p-4">
            <KanbanBoard
              clients={filtered}
              setClients={setClients}
              onCardClick={(id) => navigate(`/admin/cliente/${id}`)}
            />
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
            <p className="text-xs text-gray-400">Carregando clientes...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <AlertCircle className="w-8 h-8 text-gray-200" />
            <p className="text-sm text-gray-500">{error}</p>
            <button onClick={fetchData} className="text-xs text-primary-600 hover:underline">Tentar novamente</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">
              {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </p>
            {!search && (
              <button onClick={() => setShowModal(true)} className="text-xs text-primary-600 hover:underline">
                Criar primeiro cliente
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Template</th>
                <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Link</th>
                <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Criado em</th>
                <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => navigate(`/admin/cliente/${client.id}`)}
                  className="hover:bg-gray-50 cursor-pointer group transition-colors duration-100"
                >
                  <td className="px-6 py-3.5">
                    <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900">{client.name}</p>
                    {client.email && <p className="text-xs text-gray-400 mt-0.5">{client.email}</p>}
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={client.status} />
                  </td>
                  <td className="px-6 py-3.5">
                    <p className="text-sm text-gray-500">{client.template_name || '—'}</p>
                    {client.niche && <p className="text-xs text-gray-400 mt-0.5">{client.niche}</p>}
                  </td>
                  <td className="px-6 py-3.5">
                    {client.form_opened_at ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <Eye className="w-3 h-3" /> Abriu
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                        <EyeOff className="w-3 h-3" /> Não abriu
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-400">
                    {formatDate(client.created_at)}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-0.5">
                      <CopyButton text={api.getFormUrl(client.token)} />
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(client) }}
                        className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Excluir cliente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/cliente/${client.id}`) }}
                        className="p-1.5 rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <CreateClientModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchData() }}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Excluir cliente</h3>
                <p className="text-sm text-gray-500">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Tem certeza que deseja excluir <strong>{deleteConfirm.name}</strong>? Todos os dados serão removidos permanentemente, incluindo o site, formulário e arquivos enviados.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
