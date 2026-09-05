import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wallet, Loader2, AlertCircle, GripVertical, X, Pencil, Clock, List, LayoutGrid, ChevronDown,
} from 'lucide-react'
import { DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import AdminLayout from '../../components/AdminLayout.jsx'
import * as api from '../../services/api.js'
import { formatBRL, parseBRL } from '../../utils/currency.js'
import { getDeadlineInfo, formatDeadlineDate } from '../../utils/deadline.js'

// Etapas fixas — espelham PAYMENT_STATUSES em server/routes/clients.js.
const PAYMENT_COLUMNS = [
  { key: 'pendente',   label: 'Pendente',   color: '#9ca3af' },
  { key: 'nf_enviada', label: 'NF Enviada', color: '#f59e0b' },
  { key: 'recebido',   label: 'Recebido',   color: '#22c55e' },
]

const ALL_MONTHS = 'todos'

function sumAmounts(clients) {
  return clients.reduce((total, c) => total + (Number(c.payment_amount) || 0), 0)
}

// Mês do recebimento. O filtro de mês vale SÓ para a coluna "Recebido":
// pendências e NF enviada são saldo em aberto, não pertencem a mês nenhum
// e some-las ao trocar de mês esconderia trabalho ainda por receber.
// Cards recebidos antes de existir payment_received_at caem no prazo de
// entrega e, na falta dele, no cadastro.
function receivedMonth(client) {
  const dateOnly = client.payment_received_at || client.deadline_date
  if (dateOnly) return String(dateOnly).slice(0, 7)
  if (!client.created_at) return null
  const d = new Date(client.created_at)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// O financeiro só recebe o cliente quando ele chega na coluna final do
// kanban de clientes ("Finalizado"). Quem já tem movimento financeiro
// continua aparecendo mesmo que volte para uma etapa anterior: um valor
// já recebido não pode sumir do total do mês por causa de um ajuste.
// Sem coluna final configurada, mostra todos em vez de esvaziar o quadro.
function isInFinance(client, finalKey) {
  if (!finalKey) return true
  if (client.status === finalKey) return true
  const status = client.payment_status || 'pendente'
  return status !== 'pendente' || client.payment_amount !== null && client.payment_amount !== undefined
}

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key) {
  const [y, m] = key.split('-').map(Number)
  const label = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// Há quantos dias o card está na etapa atual. Quem calcula é o MySQL
// (DATEDIFF na consulta de clientes): o pool declara timezone '-03:00'
// enquanto o servidor roda em UTC, então comparar com o relógio do
// navegador daria 3 horas de erro. Cards anteriores ao registro desse
// marco caem no cadastro, que é quando entraram em "Pendente".
function daysInColumn(client) {
  const days = client.days_in_payment_status
  if (days === null || days === undefined) return null
  return Math.max(0, Number(days))
}

function daysLabel(days) {
  if (days === null) return null
  if (days === 0) return 'hoje'
  return `${days} dia${days > 1 ? 's' : ''}`
}

function DaysInColumn({ client, className = '' }) {
  const label = daysLabel(daysInColumn(client))
  if (!label) return null
  return (
    <span className={`inline-flex items-center gap-1 text-gray-400 ${className}`} title="Tempo nesta etapa">
      <Clock className="w-3 h-3 flex-shrink-0" />
      {label}
    </span>
  )
}

// ---- Card ----

function FinanceCard({ client, onOpenClient, onEditAmount }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `payment-${client.id}`,
    data: { client },
  })

  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined
  const amount = formatBRL(client.payment_amount)
  const deadline = getDeadlineInfo(client.deadline_date)

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
        <div className="min-w-0 flex-1" onClick={(e) => { e.stopPropagation(); onOpenClient() }}>
          <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary-700 cursor-pointer">{client.name}</p>
          {client.email && <p className="text-xs text-gray-400 truncate mt-0.5">{client.email}</p>}
        </div>
        <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
      </div>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onEditAmount() }}
        onPointerDown={(e) => e.stopPropagation()}
        title="Editar valor"
        className="mt-2.5 w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className={`text-sm font-semibold ${amount ? 'text-gray-800' : 'text-gray-300'}`}>
          {amount || 'Sem valor'}
        </span>
        <Pencil className="w-3 h-3 text-gray-300" />
      </button>

      <div className="flex items-center justify-between gap-2 mt-2.5 pt-2.5 border-t border-gray-50 text-[10px]">
        <span className="text-gray-400 font-medium truncate">{client.template_name || '—'}</span>
        <span className="flex items-center gap-2 flex-shrink-0">
          {deadline && <span className={`font-medium ${deadline.tones.text}`}>{deadline.dateLabel}</span>}
          <DaysInColumn client={client} className="font-medium" />
        </span>
      </div>
    </div>
  )
}

function FinanceCardOverlay({ client }) {
  const amount = formatBRL(client.payment_amount)
  return (
    <div className="bg-white rounded-xl border-2 border-primary-300 shadow-2xl p-3.5 w-[250px] rotate-2">
      <p className="text-sm font-semibold text-gray-900 truncate">{client.name}</p>
      <p className="text-sm font-semibold text-gray-800 mt-2">{amount || 'Sem valor'}</p>
    </div>
  )
}

// ---- Coluna do kanban ----

function FinanceColumn({ column, clients, onOpenClient, onEditAmount }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key })

  return (
    <div className="flex-shrink-0 w-[300px] flex flex-col bg-gray-50/80 rounded-xl border border-gray-100">
      <div className="px-4 py-3 rounded-t-xl border-b border-gray-100" style={{ backgroundColor: column.color + '15' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: column.color }} />
            <span className="text-xs font-bold text-gray-700">{column.label}</span>
          </div>
          <span className="text-[10px] font-bold text-gray-400 bg-white/80 px-2 py-0.5 rounded-full">{clients.length}</span>
        </div>
        <p className="text-sm font-bold text-gray-700 mt-1.5">{formatBRL(sumAmounts(clients))}</p>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 p-2 space-y-2 overflow-y-auto min-h-[120px] transition-colors rounded-b-xl ${
          isOver ? 'bg-primary-50/50 ring-2 ring-inset ring-primary-200' : ''
        }`}
        style={{ maxHeight: 'calc(100vh - 320px)' }}
      >
        {clients.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[80px]">
            <p className="text-[11px] text-gray-300 italic">Nenhum cliente nesta etapa</p>
          </div>
        ) : (
          clients.map((client) => (
            <FinanceCard
              key={client.id}
              client={client}
              onOpenClient={() => onOpenClient(client.id)}
              onEditAmount={() => onEditAmount(client)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ---- Tabela da visão em lista ----

const TH = 'px-6 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider'

function PaymentTable({ column, clients, open, onToggle, onOpenClient, onEditAmount }) {
  const isReceived = column.key === 'recebido'

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        title={open ? 'Ocultar clientes' : 'Exibir clientes'}
        className={`w-full flex items-center justify-between gap-3 px-6 py-4 text-left hover:bg-gray-50 transition-colors ${
          open ? 'border-b border-gray-100' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          <ChevronDown
            className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
          />
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: column.color }} />
          <p className="text-sm font-semibold text-gray-900">{column.label}</p>
          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{clients.length}</span>
        </div>
        <p className="text-sm font-bold text-gray-700">{formatBRL(sumAmounts(clients))}</p>
      </button>

      {!open ? null : clients.length === 0 ? (
        <p className="px-6 py-5 text-[11px] text-gray-300 italic">Nenhum cliente nesta etapa</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className={TH}>Cliente</th>
                <th className={TH}>Template</th>
                <th className={TH}>Prazo</th>
                {isReceived && <th className={TH}>Recebido em</th>}
                <th className={TH}>Dias na etapa</th>
                <th className={TH}>Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clients.map((client) => {
                const deadline = getDeadlineInfo(client.deadline_date)
                const amount = formatBRL(client.payment_amount)
                return (
                  <tr
                    key={client.id}
                    onClick={() => onOpenClient(client.id)}
                    className="hover:bg-gray-50 cursor-pointer group transition-colors duration-100"
                  >
                    <td className="px-6 py-3.5">
                      <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900">{client.name}</p>
                      {client.email && <p className="text-xs text-gray-400 mt-0.5">{client.email}</p>}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-500">{client.template_name || '—'}</td>
                    <td className="px-6 py-3.5">
                      {deadline
                        ? <span className={`text-sm font-medium ${deadline.tones.text}`}>{deadline.dateLabel}</span>
                        : <span className="text-sm text-gray-300">—</span>}
                    </td>
                    {isReceived && (
                      <td className="px-6 py-3.5 text-sm text-gray-500">
                        {formatDeadlineDate(client.payment_received_at) || '—'}
                      </td>
                    )}
                    <td className="px-6 py-3.5">
                      <DaysInColumn client={client} className="text-xs" />
                    </td>
                    <td className="px-6 py-3.5">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onEditAmount(client) }}
                        title="Editar valor"
                        className="inline-flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <span className={`text-sm font-semibold ${amount ? 'text-gray-800' : 'text-gray-300'}`}>
                          {amount || 'Sem valor'}
                        </span>
                        <Pencil className="w-3 h-3 text-gray-300" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ---- Modal do valor ----

function AmountModal({ client, targetColumn, onCancel, onConfirm }) {
  const [value, setValue] = useState(
    client.payment_amount !== null && client.payment_amount !== undefined
      ? String(Number(client.payment_amount)).replace('.', ',')
      : ''
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  // O autoFocus do JSX perde a corrida: ao terminar o arraste o dnd-kit
  // devolve o foco ao card. O rAF coloca o foco depois disso, e o select
  // deixa o valor existente pronto para ser substituido.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  const parsed = parseBRL(value)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (parsed === null) { setError('Informe um valor válido'); return }
    setError('')
    setSaving(true)
    try {
      await onConfirm(parsed)
    } catch (err) {
      setError(err.message || 'Erro ao salvar')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5 text-gray-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Valor a receber</h2>
          </div>
          <button onClick={onCancel} disabled={saving} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <p className="text-sm font-semibold text-gray-900 truncate">{client.name}</p>
            {targetColumn && (
              <p className="text-xs text-gray-400 mt-0.5">Movendo para {targetColumn.label}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Quanto você vai receber por este site?</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">R$</span>
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0,00"
                className="input-field text-sm pl-9"
                disabled={saving}
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5 h-4">
              {parsed !== null ? formatBRL(parsed) : ''}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <p className="text-red-600 text-xs">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onCancel} className="btn-secondary flex-1 justify-center text-sm" disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1 justify-center text-sm" disabled={saving}>
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Salvando...</> : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Página ----

export default function Financeiro() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [finalKey, setFinalKey] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [month, setMonth] = useState(currentMonth())
  const [viewMode, setViewMode] = useState('kanban')
  // Sanfona das tabelas — no estado da pagina para sobreviver a troca de visao.
  const [openTables, setOpenTables] = useState({ pendente: true, nf_enviada: true, recebido: true })
  const [activeClient, setActiveClient] = useState(null)
  // { client, toStatus, column } — movimento parado esperando o valor.
  const [pending, setPending] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [data, columns] = await Promise.all([
        api.getClients(),
        api.getKanbanColumns().catch(() => []),
      ])
      setClients(data.clients || [])
      // Coluna final do kanban de clientes ("Finalizado").
      const final = (columns || []).find((c) => c.is_final) || (columns || []).find((c) => c.role === 'finished')
      setFinalKey(final?.key || null)
    } catch (err) {
      setError(err.message || 'Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // Só os recebidos têm mês. O mês atual entra sempre na lista, mesmo vazio,
  // senão a seleção padrão apontaria para uma opção inexistente.
  // Universo do financeiro: clientes finalizados, mais os que ja tem movimento.
  const eligible = clients.filter((c) => isInFinance(c, finalKey))

  const monthOptions = [...new Set([
    currentMonth(),
    ...eligible.filter((c) => c.payment_status === 'recebido').map(receivedMonth).filter(Boolean),
  ])].sort().reverse()

  const grouped = {}
  PAYMENT_COLUMNS.forEach((col) => { grouped[col.key] = [] })
  eligible.forEach((client) => {
    const key = client.payment_status || 'pendente'
    if (key === 'recebido') {
      // Único grupo que o mês filtra.
      if (month === ALL_MONTHS || receivedMonth(client) === month) grouped.recebido.push(client)
      return
    }
    if (grouped[key]) grouped[key].push(client)
    else grouped.pendente.push(client)
  })

  const totals = {
    // Saldo em aberto: sempre o total, independente do mês selecionado.
    receber: sumAmounts([...grouped.pendente, ...grouped.nf_enviada]),
    recebido: sumAmounts(grouped.recebido),
  }

  // Atualiza a tela na hora e desfaz se o servidor recusar.
  const persist = async (client, toStatus, amount) => {
    const previous = clients
    setClients((prev) => prev.map((c) => (
      c.id === client.id
        ? {
            ...c,
            payment_status: toStatus,
            ...(amount !== undefined ? { payment_amount: amount } : {}),
            ...(toStatus !== (client.payment_status || 'pendente')
              ? { days_in_payment_status: 0 }
              : {}),
          }
        : c
    )))
    try {
      await api.updatePayment(client.id, toStatus, amount)
      // Relê para pegar payment_received_at, que quem decide é o servidor.
      const data = await api.getClients()
      setClients(data.clients || [])
    } catch (err) {
      setClients(previous)
      throw err
    }
  }

  const handleDragEnd = async ({ active, over }) => {
    setActiveClient(null)
    if (!over) return

    const client = active.data.current?.client
    const toStatus = over.id
    const current = client?.payment_status || 'pendente'
    if (!client || current === toStatus) return

    const column = PAYMENT_COLUMNS.find((c) => c.key === toStatus)
    const hasAmount = client.payment_amount !== null && client.payment_amount !== undefined

    // "NF Enviada" sempre pergunta o valor. "Recebido" só pergunta quando o
    // card ainda não tem valor — arrastar direto de Pendente pularia a pergunta.
    if (toStatus === 'nf_enviada' || (toStatus === 'recebido' && !hasAmount)) {
      setPending({ client, toStatus, column })
      return
    }

    try {
      await persist(client, toStatus)
    } catch (err) {
      alert('Erro ao mover: ' + (err.message || 'Tente novamente'))
    }
  }

  const handleEditAmount = (client) => {
    setPending({ client, toStatus: client.payment_status || 'pendente', column: null })
  }

  const toggleTable = (key) => setOpenTables((prev) => ({ ...prev, [key]: !prev[key] }))

  const openClient = (id) => navigate(`/admin/cliente/${id}`)

  return (
    <AdminLayout title="Financeiro">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-xl border border-gray-100 px-5 py-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">A receber</p>
              <p className="text-lg font-bold text-gray-800 mt-0.5">{formatBRL(totals.receber)}</p>
              <p className="text-[10px] text-gray-300 mt-0.5">Todos os meses</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 px-5 py-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Recebido</p>
              <p className="text-lg font-bold text-green-600 mt-0.5">{formatBRL(totals.recebido)}</p>
              <p className="text-[10px] text-gray-300 mt-0.5">{month === ALL_MONTHS ? "Todos os meses" : monthLabel(month)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="py-2 pl-3 pr-8 text-sm border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              {monthOptions.map((key) => (
                <option key={key} value={key}>{monthLabel(key)}</option>
              ))}
              <option value={ALL_MONTHS}>Todos os meses</option>
            </select>

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
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-5">
            {PAYMENT_COLUMNS.map((col) => (
              <PaymentTable
                key={col.key}
                column={col}
                clients={grouped[col.key]}
                open={openTables[col.key]}
                onToggle={() => toggleTable(col.key)}
                onOpenClient={openClient}
                onEditAmount={handleEditAmount}
              />
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={({ active }) => setActiveClient(active.data.current?.client || null)}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveClient(null)}
          >
            <div className="flex gap-3 overflow-x-auto pb-4 px-1" style={{ minHeight: 'calc(100vh - 300px)' }}>
              {PAYMENT_COLUMNS.map((col) => (
                <FinanceColumn
                  key={col.key}
                  column={col}
                  clients={grouped[col.key]}
                  onOpenClient={openClient}
                  onEditAmount={handleEditAmount}
                />
              ))}
            </div>
            <DragOverlay>
              {activeClient ? <FinanceCardOverlay client={activeClient} /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {pending && (
        <AmountModal
          client={pending.client}
          targetColumn={pending.column}
          onCancel={() => setPending(null)}
          onConfirm={async (amount) => {
            await persist(pending.client, pending.toStatus, amount)
            setPending(null)
          }}
        />
      )}
    </AdminLayout>
  )
}
