import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Clock, Eye, Globe, Plus, X, Copy, Check,
  ChevronRight, Loader2, AlertCircle, UserPlus, Search
} from 'lucide-react'
import AdminLayout from '../../components/AdminLayout.jsx'
import * as api from '../../services/api.js'
import { CreateClientModal } from './Clients.jsx'

const STATUS_CONFIG = {
  formulario_pendente:   { label: 'Form. Pendente',      dot: 'bg-gray-400' },
  formulario_preenchido: { label: 'Form. Preenchido',    dot: 'bg-gray-500' },
  em_edicao:             { label: 'Em Edição',           dot: 'bg-gray-600' },
  aguardando_aprovacao:  { label: 'Aguard. Aprovação',   dot: 'bg-gray-700' },
  alteracao_solicitada:  { label: 'Alteração Solicitada',dot: 'bg-primary-600' },
  aprovado:              { label: 'Aprovado',            dot: 'bg-gray-800' },
  publicado:             { label: 'Publicado',           dot: 'bg-gray-900' },
}

function StatusBadge({ status, columns }) {
  const col = columns?.find(c => c.key === status)
  const label = col?.label || STATUS_CONFIG[status]?.label || status
  const color = col?.color || '#9ca3af'
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

function StatCard({ title, value, icon: Icon, loading }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">
          {loading ? <span className="inline-block w-8 h-7 bg-gray-100 rounded animate-pulse" /> : value}
        </p>
      </div>
      <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  )
}

function CopyButton({ text, size = 'sm' }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async (e) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      title="Copiar link"
      className="p-1.5 rounded-md text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-all duration-150"
    >
      {copied ? <Check className="w-4 h-4 text-primary-600" /> : <Copy className="w-4 h-4" />}
    </button>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [kanbanColumns, setKanbanColumns] = useState([])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [data, cols] = await Promise.all([api.getClients(), api.getKanbanColumns().catch(() => [])])
      setClients(data.clients || [])
      setStats(data.stats || {})
      setKanbanColumns(cols || [])
    } catch (err) {
      setError(err.message || 'Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleClientCreated = (client) => {
    setShowModal(false)
    fetchData()
  }

  const filteredClients = clients.filter((c) =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.template_name?.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <AdminLayout title="Dashboard">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total de Clientes" value={stats.total || 0} icon={Users} loading={loading} />
        <StatCard title="Formulários Pendentes" value={stats.formulario_pendente || 0} icon={Clock} loading={loading} />
        <StatCard title="Aguardando Aprovação" value={stats.aguardando_aprovacao || 0} icon={Eye} loading={loading} />
        <StatCard title="Entregues" value={stats.publicado || 0} icon={Globe} loading={loading} />
      </div>

      {/* Clients table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-gray-900">Clientes</h2>
          <div className="flex items-center gap-3">
            <div className="relative w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
              <Plus className="w-4 h-4" />
              Novo Cliente
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-sm">Carregando clientes...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-red-600 font-medium">{error}</p>
              <button onClick={fetchData} className="mt-3 text-sm text-primary-600 hover:underline">
                Tentar novamente
              </button>
            </div>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">
              {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </p>
            {!search && (
              <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-primary-600 hover:underline">
                Criar primeiro cliente
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Template</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => navigate(`/admin/cliente/${client.id}`)}
                    className="hover:bg-gray-50 cursor-pointer group transition-colors duration-100"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">{client.name}</p>
                        {client.email && <p className="text-xs text-gray-400 mt-0.5">{client.email}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={client.status} columns={kanbanColumns} />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-gray-700">{client.template_name || '—'}</p>
                        {client.niche && <p className="text-xs text-gray-400">{client.niche}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(client.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <CopyButton text={api.getFormUrl(client.token)} />
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/admin/cliente/${client.id}`) }}
                          className="p-1.5 rounded-md text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <CreateClientModal
          onClose={() => setShowModal(false)}
          onSuccess={handleClientCreated}
        />
      )}
    </AdminLayout>
  )
}
