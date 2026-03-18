import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Copy, Check, ExternalLink, Clock, User, Mail, Phone,
  Layers, Link2, AlertCircle, Loader2, ChevronDown, ChevronUp,
  RefreshCw, MessageSquare, CheckCircle2, XCircle, FileText, Download,
  Send, Upload, Globe, Edit3, Info
} from 'lucide-react'
import AdminLayout from '../../components/AdminLayout.jsx'
import * as api from '../../services/api.js'

function flattenObject(obj, prefix = '') {
  return Object.entries(obj).reduce((acc, [key, val]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(acc, flattenObject(val, fullKey))
    } else {
      acc[fullKey] = val
    }
    return acc
  }, {})
}

function unflattenObject(flat) {
  const result = {}
  for (const [dotKey, val] of Object.entries(flat)) {
    const parts = dotKey.split('.')
    let obj = result
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in obj)) obj[parts[i]] = {}
      obj = obj[parts[i]]
    }
    obj[parts[parts.length - 1]] = val
  }
  return result
}

const STATUS_CONFIG = {
  formulario_pendente:   { label: 'Formulário Pendente',  dot: 'bg-gray-400' },
  formulario_preenchido: { label: 'Formulário Preenchido',dot: 'bg-gray-500' },
  em_edicao:             { label: 'Em Edição',            dot: 'bg-gray-600' },
  aguardando_aprovacao:  { label: 'Aguardando Aprovação', dot: 'bg-gray-700' },
  alteracao_solicitada:  { label: 'Alteração Solicitada', dot: 'bg-primary-600' },
  aprovado:              { label: 'Aprovado',             dot: 'bg-gray-800' },
  publicado:             { label: 'Entregue',             dot: 'bg-gray-900' },
}

const ALL_STATUSES = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }))

const PIPELINE_STEPS = [
  { key: 'formulario_pendente',   label: 'Formulário Pendente' },
  { key: 'formulario_preenchido', label: 'Formulário Preenchido' },
  { key: 'em_edicao',             label: 'Em Edição' },
  { key: 'aguardando_aprovacao',  label: 'Aguardando Aprovação' },
  { key: 'alteracao_solicitada',  label: 'Alteração Solicitada' },
  { key: 'aprovado',              label: 'Aprovado' },
  { key: 'publicado',             label: 'Entregue' },
]

function StatusPipeline({ currentStatus, onStatusChange, updating }) {
  const [confirmModal, setConfirmModal] = useState(null) // null or { key, label }
  const currentIdx = PIPELINE_STEPS.findIndex(s => s.key === currentStatus)

  return (
    <>
      <div className="flex items-center bg-white border border-gray-100 rounded-xl shadow-sm mb-6 overflow-hidden">
        {PIPELINE_STEPS.map((step, idx) => {
          const isCurrent = step.key === currentStatus
          const isPast = idx < currentIdx
          const isFuture = idx > currentIdx

          return (
            <button
              key={step.key}
              onClick={() => {
                if (!isCurrent && !updating) setConfirmModal(step)
              }}
              disabled={updating}
              className={`flex-1 relative px-3 py-3.5 text-center transition-all text-xs font-semibold border-b-2 ${
                isCurrent
                  ? 'bg-primary-50 text-primary-700 border-primary-500'
                  : isPast
                    ? 'bg-green-50/50 text-green-700 border-green-400 hover:bg-green-50'
                    : 'bg-white text-gray-400 border-transparent hover:bg-gray-50 hover:text-gray-600'
              } ${updating ? 'opacity-50 cursor-not-allowed' : isCurrent ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span className="block truncate">{step.label}</span>
              {isCurrent && (
                <span className="absolute -bottom-px left-1/2 -translate-x-1/2 w-2 h-2 bg-primary-500 rounded-full -mb-1" />
              )}
            </button>
          )
        })}
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setConfirmModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Alterar status</h3>
                <p className="text-xs text-gray-500">Esta ação irá atualizar o status do cliente</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="flex-1 text-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Atual</p>
                  <p className="text-sm font-semibold text-gray-700">{STATUS_CONFIG[currentStatus]?.label || currentStatus}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <div className="flex-1 text-center">
                  <p className="text-[10px] text-primary-500 uppercase tracking-wider mb-1">Novo</p>
                  <p className="text-sm font-semibold text-primary-700">{confirmModal.label}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onStatusChange(confirmModal.key)
                  setConfirmModal(null)
                }}
                disabled={updating}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {updating ? 'Atualizando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, dot: 'bg-gray-400' }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 font-medium">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />
      {config.label}
    </span>
  )
}

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all duration-150"
    >
      {copied ? <Check className="w-3 h-3 text-primary-600" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copiado!' : (label || 'Copiar')}
    </button>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-800 font-medium mt-0.5 break-words">{value}</p>
      </div>
    </div>
  )
}

const LABELS = {
  // grupos
  brand: 'Marca', professional: 'Profissional', hero: 'Foto Principal',
  about: 'Sobre', services: 'Serviços', testimonials: 'Depoimentos',
  faq: 'Perguntas Frequentes', contact: 'Contato', social: 'Redes Sociais',
  preferences: 'Preferências',
  // campos
  name: 'Nome', tagline: 'Slogan', logo: 'Logo', title: 'Título',
  crn: 'Registro (CRN/CRO)', instagram: 'Instagram', image: 'Foto',
  bio: 'Biografia', experience_years: 'Anos de Experiência',
  patients_count: 'Pacientes Atendidos', differentials: 'Diferenciais',
  description: 'Descrição', tag: 'Título da Seção', items: 'Itens',
  text: 'Depoimento', detail: 'Detalhe', question: 'Pergunta', answer: 'Resposta',
  whatsapp: 'WhatsApp', phone: 'Telefone', email: 'E-mail',
  address: 'Endereço', hours: 'Horário', maps_link: 'Link do Google Maps',
  facebook: 'Facebook', tiktok: 'TikTok', youtube: 'YouTube',
  color: 'Cor Preferida', color_custom: 'Cor Personalizada',
  color_method: 'Método de Cor', color_picker: 'Cor Escolhida',
  color_iv: 'Identidade Visual', color_iv_link: 'Link da IV',
  approval_rate: 'Taxa de Aprovação',
  style: 'Estilo Visual', notes: 'Observações',
  has_bank: 'Banco de Imagens', bank_link: 'Link do Banco',
}

const t = (key) => LABELS[key] || key.replace(/_/g, ' ')

function InlineCopy({ value }) {
  const [copied, setCopied] = useState(false)
  const handle = async (e) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <span className="flex items-start gap-1.5 group/copy">
      <span className="text-sm text-gray-800 break-words flex-1">{value}</span>
      <button
        onClick={handle}
        className="flex-shrink-0 mt-0.5 opacity-0 group-hover/copy:opacity-100 transition-opacity text-gray-300 hover:text-gray-500"
        title="Copiar"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-gray-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </span>
  )
}

function isImagePath(val) {
  if (typeof val !== 'string') return false
  return val.startsWith('uploads/') || /\.(jpg|jpeg|png|webp|avif)$/i.test(val)
}

function FieldValue({ label, value }) {
  if (value === null || value === undefined || value === '') return null

  if (isImagePath(value)) {
    const src = `http://localhost:3000/${value}`
    const filename = value.split('/').pop()
    return (
      <div className="py-2">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1.5">{t(label)}</p>
        <div className="relative group inline-block">
          <img
            src={src}
            alt={label}
            className="h-28 w-auto rounded-lg border border-gray-100 object-cover"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <a
            href={src}
            download={filename}
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
            title="Baixar imagem"
          >
            <Download className="w-5 h-5 text-white" />
          </a>
        </div>
      </div>
    )
  }

  if (Array.isArray(value)) {
    return (
      <div className="py-2">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-2">{t(label)}</p>
        <div className="space-y-2">
          {value.map((item, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-lg px-3 py-2.5">
              {typeof item === 'object' && item !== null ? (
                <div className="space-y-1">
                  {Object.entries(item).map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-sm">
                      <span className="text-gray-400 flex-shrink-0 min-w-[80px]">{t(k)}</span>
                      {isImagePath(v) ? (
                        <div className="relative group inline-block">
                          <img src={`http://localhost:3000/${v}`} alt={k} className="h-16 w-auto rounded object-cover border border-gray-100" onError={(e) => { e.target.style.display='none' }} />
                          <a href={`http://localhost:3000/${v}`} download={v.split('/').pop()} onClick={(e) => e.stopPropagation()} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded" title="Baixar">
                            <Download className="w-4 h-4 text-white" />
                          </a>
                        </div>
                      ) : (
                        <InlineCopy value={String(v)} />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-gray-800">{String(item)}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="py-1.5">
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{t(label)}</p>
      <InlineCopy value={String(value)} />
    </div>
  )
}

function GroupBlock({ groupKey, value }) {
  const label = t(groupKey)

  if (Array.isArray(value)) {
    return (
      <div className="bg-gray-50 rounded-lg px-4 py-3">
        <FieldValue label={label} value={value} />
      </div>
    )
  }

  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value).filter(([, v]) => v !== null && v !== undefined && v !== '')
    return (
      <div className="bg-gray-50 rounded-lg px-4 py-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
        <div className="divide-y divide-gray-100">
          {entries.map(([k, v]) => (
            <FieldValue key={k} label={k} value={v} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 rounded-lg px-4 py-3">
      <FieldValue label={label} value={value} />
    </div>
  )
}

function FormDataSection({ formData, schema }) {
  const [expanded, setExpanded] = useState(true)

  // Build a map of field.key → field.label from schema
  // For list sub-fields, use composite key: "parentKey::subKey"
  const fieldLabels = useMemo(() => {
    const map = {}
    if (!schema || !schema.steps) return map
    schema.steps.forEach(step => {
      (step.fields || []).forEach(field => {
        map[field.key] = field.label
        if (field.itemFields) {
          field.itemFields.forEach(sf => {
            map[`${field.key}::${sf.key}`] = sf.label
          })
        }
      })
    })
    return map
  }, [schema])

  const getLabel = (key, parentKey) => {
    if (parentKey && fieldLabels[`${parentKey}::${key}`]) return fieldLabels[`${parentKey}::${key}`]
    if (fieldLabels[key]) return fieldLabels[key]
    return LABELS[key] || LABELS[key.split('.').pop()] || key.replace(/[_.]/g, ' ')
  }

  if (!formData) {
    return (
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          Dados do Formulário
        </h3>
        <div className="flex flex-col items-center py-8 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
            <FileText className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm">Formulário ainda não preenchido</p>
        </div>
      </div>
    )
  }

  // Build flat key-value pairs for display (formData may already be flat with dotted keys)
  const flatEntries = []
  const suggestKeys = []

  for (const [key, value] of Object.entries(formData)) {
    if (key.endsWith('_suggest')) {
      if (value === true) suggestKeys.push(key.replace('_suggest', ''))
      continue
    }
    if (value === null || value === undefined || value === '') continue
    if (Array.isArray(value)) {
      flatEntries.push({ key, value, type: 'list' })
    } else if (typeof value === 'object' && value !== null) {
      // Nested object — flatten it
      for (const [subKey, subVal] of Object.entries(value)) {
        const fullKey = `${key}.${subKey}`
        if (subVal === null || subVal === undefined || subVal === '') continue
        if (Array.isArray(subVal)) {
          flatEntries.push({ key: fullKey, value: subVal, type: 'list' })
        } else {
          flatEntries.push({ key: fullKey, value: String(subVal), type: 'text' })
        }
      }
    } else {
      flatEntries.push({ key, value: String(value), type: 'text' })
    }
  }

  // Group entries by schema steps if available
  const groupedByStep = []
  if (schema && schema.steps) {
    schema.steps.forEach(step => {
      const stepFieldKeys = (step.fields || []).map(f => f.key)
      const stepEntries = flatEntries.filter(e => stepFieldKeys.includes(e.key))
      // Also check for suggest keys in this step
      const stepSuggestEntries = suggestKeys.filter(sk =>
        stepFieldKeys.some(fk => fk === sk)
      )
      if (stepEntries.length > 0 || stepSuggestEntries.length > 0) {
        groupedByStep.push({ step, entries: stepEntries, suggests: stepSuggestEntries })
      }
    })
    // Add any entries not matched to a step
    const allGroupedKeys = groupedByStep.flatMap(g => g.entries.map(e => e.key))
    const ungrouped = flatEntries.filter(e => !allGroupedKeys.includes(e.key))
    if (ungrouped.length > 0) {
      groupedByStep.push({ step: { title: 'Outros' }, entries: ungrouped, suggests: [] })
    }
  } else {
    groupedByStep.push({ step: { title: 'Respostas' }, entries: flatEntries, suggests: suggestKeys })
  }

  return (
    <div className="card">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          Dados do Formulário
        </h3>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {groupedByStep.map((group, gi) => (
            <div key={gi} className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{group.step.title}</p>
              {group.entries.map((entry) => (
                <div key={entry.key} className="bg-gray-50 rounded-lg px-4 py-3">
                  {entry.type === 'list' ? (
                    <>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{getLabel(entry.key)}</p>
                      <div className="space-y-2">
                        {entry.value.map((item, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3 border border-gray-100">
                            {typeof item === 'object' ? (
                              Object.entries(item).filter(([,v]) => v).map(([k, v]) => (
                                <div key={k} className="flex items-start gap-3 py-1">
                                  <span className="text-xs text-gray-400 font-medium w-28 flex-shrink-0">{getLabel(k, entry.key)}</span>
                                  <span className="text-sm text-gray-800">{String(v)}</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-sm text-gray-800">{String(item)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(entry.value) ? (
                    <>
                      <p className="text-xs text-gray-400 font-medium mb-2">{getLabel(entry.key)}</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg border border-gray-200 shadow-sm" style={{ backgroundColor: entry.value }} />
                        <span className="text-sm text-gray-800 font-mono font-medium">{entry.value}</span>
                      </div>
                    </>
                  ) : /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(entry.value) || (entry.value.startsWith('uploads/') && /\.(png|jpe?g|gif|webp|svg)/i.test(entry.value)) ? (
                    <>
                      <p className="text-xs text-gray-400 font-medium mb-2">{getLabel(entry.key)}</p>
                      <div className="relative group inline-block rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={entry.value.startsWith('http') ? entry.value : `/${entry.value}`}
                          alt={getLabel(entry.key)}
                          className="max-h-40 object-contain"
                        />
                        <a
                          href={entry.value.startsWith('http') ? entry.value : `/${entry.value}`}
                          download
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-sm font-semibold"
                        >
                          <Download className="w-4 h-4" />
                          Baixar
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-gray-400 font-medium">{getLabel(entry.key)}</p>
                      <p className="text-sm text-gray-800 font-medium mt-0.5">
                        {entry.value === 'true' ? 'Sim' : entry.value === 'false' ? 'Não' : entry.value}
                      </p>
                    </>
                  )}
                </div>
              ))}
              {group.suggests.map((sk) => (
                <div key={sk} className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1">{getLabel(sk)}</p>
                  <p className="text-sm text-blue-700 flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.5v1h-4v-1C8.8 8.8 8 7.5 8 6a4 4 0 0 1 4-4z"/><rect x="9" y="13" width="6" height="3" rx="1"/><path d="M10 16v1a2 2 0 0 0 4 0v-1"/></svg>
                    Cliente solicitou sugestões do desenvolvedor
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RevisionTimeline({ revisions }) {
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const getRevisionIcon = (type) => {
    switch (type) {
      case 'approve': return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'request_revision': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <MessageSquare className="w-4 h-4 text-blue-500" />
    }
  }

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-gray-400" />
        Histórico de Revisões
        {revisions.length > 0 && (
          <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {revisions.length}
          </span>
        )}
      </h3>

      {revisions.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm">Nenhuma revisão ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {revisions.map((rev, i) => (
            <div key={rev.id || i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gray-50 border-2 border-gray-100 flex items-center justify-center flex-shrink-0">
                  {getRevisionIcon(rev.action)}
                </div>
                {i < revisions.length - 1 && <div className="w-0.5 h-full bg-gray-100 mt-1" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800">
                    {rev.action === 'approve' ? 'Site Aprovado' :
                     rev.action === 'request_revision' ? 'Alteração Solicitada' :
                     rev.action || 'Evento'}
                  </p>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(rev.created_at)}</span>
                </div>
                {rev.message && (
                  <p className="mt-1 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                    "{rev.message}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ZipUploader({ client, revisions }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [previewKey, setPreviewKey] = useState(0)
  const previewUrl = api.getPreviewUrl(client.token)
  const customSiteUrl = `http://localhost:3000/sites/${client.token}/index.html`

  const formatDate = (d) => new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const REV_TYPES = {
    publish:          { label: 'Atualização publicada', dot: 'bg-primary-500' },
    submit:           { label: 'Formulário enviado',    dot: 'bg-gray-400' },
    approval:         { label: 'Site aprovado',         dot: 'bg-green-500' },
    revision_request: { label: 'Alteração solicitada',  dot: 'bg-orange-400' },
  }

  const handleFile = async (file) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.zip')) { setError('Somente arquivos .zip'); return }
    setError(''); setUploading(true); setSuccess(false)
    try {
      await api.uploadSiteZip(client.id, file)
      setSuccess(true)
      setPreviewKey((k) => k + 1)
    } catch (err) {
      setError(err.message || 'Erro ao enviar ZIP')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Top bar: upload + info */}
      <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
        <div className="flex flex-wrap items-start gap-4 p-4">
          {/* Upload area */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div
              onClick={() => !uploading && inputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl px-6 py-4 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all flex-shrink-0"
            >
              {uploading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                  <p className="text-xs text-gray-500">Enviando...</p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-gray-300" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-600">Enviar atualização</p>
                    <p className="text-xs text-gray-400">.zip com index.html na raiz</p>
                  </div>
                </div>
              )}
            </div>
            <input ref={inputRef} type="file" accept=".zip" className="hidden" onChange={(e) => handleFile(e.target.files[0])} disabled={uploading} />

            {success && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <p className="text-xs text-green-700 font-medium">Enviado com sucesso!</p>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}
          </div>

          {/* URL + revisions summary */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">URL do site</p>
              <p className="text-xs text-gray-500 font-mono break-all max-w-[300px]">{customSiteUrl}</p>
            </div>
            {revisions.length > 0 && (
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Última atualização</p>
                <p className="text-xs text-gray-500">{formatDate(revisions[0]?.created_at)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Revision logs - collapsible horizontal */}
        {revisions.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-2 flex items-center gap-3 overflow-x-auto">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex-shrink-0">Histórico</p>
            {revisions.map((rev, i) => {
              const cfg = REV_TYPES[rev.type] || { label: rev.type || 'Evento', dot: 'bg-gray-300' }
              const isEditSubmit = rev.type === 'submit' && rev.message && rev.message.toLowerCase().includes('atualizado')
              const displayLabel = isEditSubmit ? 'Edição enviada' : cfg.label
              return (
                <div key={rev.id || i} className="flex items-center gap-1.5 flex-shrink-0 bg-gray-50 rounded-lg px-2.5 py-1.5" title={rev.message || ''}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isEditSubmit ? 'bg-blue-400' : cfg.dot}`} />
                  <span className="text-xs text-gray-600">{displayLabel}</span>
                  <span className="text-[10px] text-gray-400">{formatDate(rev.created_at)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Full-width site preview */}
      <div className="rounded-xl border border-gray-100 overflow-hidden bg-gray-100 h-[100vh]">
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100 flex-shrink-0">
          <span className="text-xs text-gray-400 font-medium">Site atual</span>
          <div className="flex items-center gap-3">
            <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Abrir
            </a>
            <button onClick={() => setPreviewKey((k) => k + 1)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Atualizar
            </button>
          </div>
        </div>
        <iframe key={previewKey} src={previewUrl} className="w-full h-[calc(100%-36px)] border-0" title="Preview" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
      </div>
    </div>
  )
}

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [client, setClient] = useState(null)
  const [revisions, setRevisions] = useState([])
  const [templateSchema, setTemplateSchema] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusValue, setStatusValue] = useState('')
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [statusSuccess, setStatusSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState('info')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await api.getClient(id)
      setClient(data.client)
      setRevisions(data.revisions || [])
      setStatusValue(data.client.status)

      // Load template schema for field labels
      if (data.client.template_slug) {
        try {
          const schemaRes = await fetch(`/templates/${data.client.template_slug}/schema.json`)
          if (schemaRes.ok) {
            const schema = await schemaRes.json()
            setTemplateSchema(schema)
          }
        } catch (e) { /* schema not available, will use fallback labels */ }
      }
    } catch (err) {
      setError(err.message || 'Erro ao carregar cliente')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleStatusUpdate = async () => {
    if (!statusValue || statusValue === client?.status) return
    setStatusUpdating(true)
    try {
      await api.updateStatus(parseInt(id), statusValue)
      setClient(prev => ({ ...prev, status: statusValue }))
      setStatusSuccess(true)
      setTimeout(() => setStatusSuccess(false), 2000)
    } catch (err) {
      alert(err.message || 'Erro ao atualizar status')
    } finally {
      setStatusUpdating(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <AdminLayout title="Detalhes do Cliente">
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            <p className="text-gray-500 text-sm">Carregando cliente...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout title="Detalhes do Cliente">
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <p className="text-red-600 font-medium text-lg mb-2">{error}</p>
          <button onClick={fetchData} className="text-sm text-primary-600 hover:underline">
            Tentar novamente
          </button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title={client?.name || 'Cliente'}
      actions={
        <button
          onClick={fetchData}
          className="btn-secondary"
          title="Atualizar"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      }
    >
      {/* Back + tabs */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/admin/clientes')}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'info', label: 'Informações', icon: Info },
            { id: 'zip', label: 'Site Personalizado', icon: Globe },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Status Pipeline */}
      <StatusPipeline
        currentStatus={client?.status}
        onStatusChange={async (newStatus) => {
          setStatusValue(newStatus)
          setStatusUpdating(true)
          try {
            await api.updateStatus(parseInt(id), newStatus)
            setClient(prev => ({ ...prev, status: newStatus }))
            setStatusValue(newStatus)
            setStatusSuccess(true)
            setTimeout(() => setStatusSuccess(false), 2000)
          } catch (err) {
            alert(err.message || 'Erro ao atualizar status')
          } finally {
            setStatusUpdating(false)
          }
        }}
        updating={statusUpdating}
      />

      {/* TAB: Informações */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Informações do Cliente</h3>
                <StatusBadge status={client?.status} />
              </div>
              <div>
                <InfoRow icon={User} label="Nome" value={client?.name} />
                <InfoRow icon={Mail} label="E-mail" value={client?.email} />
                <InfoRow icon={Phone} label="Telefone" value={client?.phone} />
                <InfoRow icon={Layers} label="Template" value={client?.template_name} />
                <InfoRow icon={Clock} label="Cadastrado em" value={formatDate(client?.created_at)} />
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-gray-400" />
                Links
              </h3>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Link do Cliente</p>
                    <CopyButton text={api.getFormUrl(client?.token)} label="Copiar" />
                  </div>
                  <p className="text-xs text-gray-400 font-mono break-all">{api.getFormUrl(client?.token)}</p>
                  <p className="text-xs text-gray-400 mt-2">Formulário, resumo e aprovação — tudo neste link.</p>
                </div>
                <a
                  href={api.getPreviewUrl(client?.token)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir Preview do Site
                </a>
              </div>
            </div>

          </div>

          <div className="lg:col-span-3 space-y-5">
            <FormDataSection formData={client?.form_data} schema={templateSchema} />
            <RevisionTimeline revisions={revisions} />
          </div>
        </div>
      )}

      {/* TAB: Editor do Site */}
      {activeTab === 'editor' && <SiteEditor client={client} />}

      {/* TAB: Site Personalizado */}
      {activeTab === 'zip' && <ZipUploader client={client} revisions={revisions} />}
    </AdminLayout>
  )
}
