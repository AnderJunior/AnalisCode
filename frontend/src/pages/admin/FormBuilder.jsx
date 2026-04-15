import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, GripVertical, ChevronUp, ChevronDown, Save, Loader2,
  Type, Hash, Upload, SlidersHorizontal, List, CircleDot, Eye, Settings, X, Copy
} from 'lucide-react'
import AdminLayout from '../../components/AdminLayout.jsx'
import * as api from '../../services/api.js'

const FIELD_TYPES = [
  { type: 'text', label: 'Texto', icon: Type, desc: 'Campo de texto simples' },
  { type: 'textarea', label: 'Texto longo', icon: Type, desc: 'Área de texto multilinha' },
  { type: 'number', label: 'Número', icon: Hash, desc: 'Campo numérico' },
  { type: 'file', label: 'Arquivo', icon: Upload, desc: 'Upload de arquivo' },
  { type: 'image', label: 'Imagem', icon: Upload, desc: 'Upload de imagem' },
  { type: 'slider', label: 'Slider', icon: SlidersHorizontal, desc: 'Controle deslizante' },
  { type: 'select', label: 'Select', icon: List, desc: 'Lista suspensa' },
  { type: 'radio', label: 'Radio', icon: CircleDot, desc: 'Opções de seleção única' },
  { type: 'choice', label: 'Escolha', icon: CircleDot, desc: 'Botões de escolha' },
]

const WIDTH_OPTIONS = [
  { value: '100', label: '100%' },
  { value: '50', label: '50%' },
  { value: '33', label: '33%' },
  { value: '66', label: '66%' },
  { value: '25', label: '25%' },
  { value: '75', label: '75%' },
]

function generateId() {
  return 'f_' + Math.random().toString(36).substr(2, 8)
}

function FieldCard({ field, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [expanded, setExpanded] = useState(false)
  const typeInfo = FIELD_TYPES.find(t => t.type === field.type) || FIELD_TYPES[0]
  const Icon = typeInfo.icon

  return (
    <div className={`bg-white border rounded-xl transition-all ${expanded ? 'border-primary-200 shadow-sm' : 'border-gray-100'}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onMoveUp() }} disabled={isFirst} className="p-0.5 text-gray-300 hover:text-gray-500 disabled:opacity-30">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onMoveDown() }} disabled={isLast} className="p-0.5 text-gray-300 hover:text-gray-500 disabled:opacity-30">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{field.label || 'Sem título'}</p>
          <p className="text-[10px] text-gray-400">{typeInfo.label} · {field.width || 100}%</p>
        </div>
        {field.required && (
          <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-medium">Obrigatório</span>
        )}
        <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Expanded Config */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Label da pergunta</label>
              <input
                type="text"
                value={field.label}
                onChange={e => onUpdate({ ...field, label: e.target.value })}
                className="input-field text-sm"
                placeholder="Ex: Qual seu nome?"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Chave (key)</label>
              <input
                type="text"
                value={field.key}
                onChange={e => onUpdate({ ...field, key: e.target.value })}
                className="input-field text-sm"
                placeholder="Ex: nome_completo"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
              <select
                value={field.type}
                onChange={e => onUpdate({ ...field, type: e.target.value })}
                className="input-field text-sm"
              >
                {FIELD_TYPES.map(t => (
                  <option key={t.type} value={t.type}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Largura</label>
              <select
                value={field.width || '100'}
                onChange={e => onUpdate({ ...field, width: e.target.value })}
                className="input-field text-sm"
              >
                {WIDTH_OPTIONS.map(w => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer py-2">
                <input
                  type="checkbox"
                  checked={field.required || false}
                  onChange={e => onUpdate({ ...field, required: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600"
                />
                <span className="text-xs font-medium text-gray-600">Obrigatório</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Placeholder</label>
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={e => onUpdate({ ...field, placeholder: e.target.value })}
              className="input-field text-sm"
              placeholder="Texto de exemplo..."
            />
          </div>

          {field.type === 'textarea' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Máximo de caracteres</label>
              <input
                type="number"
                value={field.maxLength || ''}
                onChange={e => onUpdate({ ...field, maxLength: parseInt(e.target.value) || undefined })}
                className="input-field text-sm"
                placeholder="500"
              />
            </div>
          )}

          {field.type === 'slider' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Mínimo</label>
                <input type="number" value={field.min ?? 0} onChange={e => onUpdate({ ...field, min: parseInt(e.target.value) || 0 })} className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Máximo</label>
                <input type="number" value={field.max ?? 100} onChange={e => onUpdate({ ...field, max: parseInt(e.target.value) || 100 })} className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Passo</label>
                <input type="number" value={field.step ?? 1} onChange={e => onUpdate({ ...field, step: parseInt(e.target.value) || 1 })} className="input-field text-sm" />
              </div>
            </div>
          )}

          {(field.type === 'select' || field.type === 'radio' || field.type === 'choice') && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Opções (uma por linha)</label>
              <textarea
                value={(field.options || []).join('\n')}
                onChange={e => onUpdate({ ...field, options: e.target.value.split('\n').filter(o => o.trim()) })}
                className="input-field text-sm"
                rows={4}
                placeholder={"Opção 1\nOpção 2\nOpção 3"}
              />
            </div>
          )}

          {field.type === 'number' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Mínimo</label>
                <input type="number" value={field.min ?? ''} onChange={e => onUpdate({ ...field, min: e.target.value ? parseInt(e.target.value) : undefined })} className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Máximo</label>
                <input type="number" value={field.max ?? ''} onChange={e => onUpdate({ ...field, max: e.target.value ? parseInt(e.target.value) : undefined })} className="input-field text-sm" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Dica / instrução</label>
            <input
              type="text"
              value={field.hint || ''}
              onChange={e => onUpdate({ ...field, hint: e.target.value })}
              className="input-field text-sm"
              placeholder="Instrução adicional para o cliente"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function StepEditor({ step, stepIndex, onUpdate, onDelete, onAddField, totalSteps }) {
  const [collapsed, setCollapsed] = useState(false)

  const updateField = (fieldIndex, updated) => {
    const fields = [...step.fields]
    fields[fieldIndex] = updated
    onUpdate({ ...step, fields })
  }

  const deleteField = (fieldIndex) => {
    const fields = step.fields.filter((_, i) => i !== fieldIndex)
    onUpdate({ ...step, fields })
  }

  const moveField = (fromIndex, direction) => {
    const fields = [...step.fields]
    const toIndex = fromIndex + direction
    if (toIndex < 0 || toIndex >= fields.length) return
    ;[fields[fromIndex], fields[toIndex]] = [fields[toIndex], fields[fromIndex]]
    onUpdate({ ...step, fields })
  }

  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
      {/* Step Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 flex-1">
          <span className="w-8 h-8 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-sm font-bold">
            {stepIndex + 1}
          </span>
          <div className="flex-1">
            <input
              type="text"
              value={step.title}
              onChange={e => onUpdate({ ...step, title: e.target.value })}
              className="text-sm font-semibold text-gray-900 bg-transparent border-0 p-0 focus:ring-0 w-full"
              placeholder="Título da etapa"
            />
            <input
              type="text"
              value={step.description || ''}
              onChange={e => onUpdate({ ...step, description: e.target.value })}
              className="text-xs text-gray-400 bg-transparent border-0 p-0 focus:ring-0 w-full mt-0.5"
              placeholder="Descrição da etapa (opcional)"
            />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          {totalSteps > 1 && (
            <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Fields */}
      {!collapsed && (
        <div className="p-4 space-y-2">
          {step.fields.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">Nenhum campo. Adicione um campo abaixo.</p>
          ) : (
            step.fields.map((field, fi) => (
              <FieldCard
                key={field._id || fi}
                field={field}
                onUpdate={(updated) => updateField(fi, updated)}
                onDelete={() => deleteField(fi)}
                onMoveUp={() => moveField(fi, -1)}
                onMoveDown={() => moveField(fi, 1)}
                isFirst={fi === 0}
                isLast={fi === step.fields.length - 1}
              />
            ))
          )}

          {/* Add field button */}
          <button
            onClick={onAddField}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Adicionar campo
          </button>
        </div>
      )}
    </div>
  )
}

// Preview of how fields will look with widths
function FormPreview({ schema }) {
  if (!schema || !schema.steps) return null

  return (
    <div className="space-y-6">
      {schema.steps.map((step, si) => (
        <div key={si}>
          <h3 className="text-sm font-bold text-gray-800 mb-1">{step.title || `Etapa ${si + 1}`}</h3>
          {step.description && <p className="text-xs text-gray-400 mb-3">{step.description}</p>}
          <div className="flex flex-wrap gap-3">
            {step.fields.map((field, fi) => {
              const w = parseInt(field.width) || 100
              const widthClass = w <= 25 ? 'w-[calc(25%-9px)]' : w <= 33 ? 'w-[calc(33.333%-8px)]' : w <= 50 ? 'w-[calc(50%-6px)]' : w <= 66 ? 'w-[calc(66.666%-4px)]' : w <= 75 ? 'w-[calc(75%-3px)]' : 'w-full'
              return (
                <div key={fi} className={`${widthClass} bg-white border border-gray-100 rounded-lg p-3`}>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    {field.label || 'Campo'}
                    {field.required && <span className="text-red-400 ml-0.5">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <div className="h-16 bg-gray-50 rounded border border-gray-100" />
                  ) : field.type === 'select' ? (
                    <div className="h-9 bg-gray-50 rounded border border-gray-100 flex items-center px-2 text-xs text-gray-300">Selecione...</div>
                  ) : field.type === 'radio' || field.type === 'choice' ? (
                    <div className="flex flex-wrap gap-1.5">
                      {(field.options || ['Opção 1', 'Opção 2']).slice(0, 4).map((o, i) => (
                        <span key={i} className="text-[10px] bg-gray-50 border border-gray-100 rounded-full px-2 py-1 text-gray-400">{o}</span>
                      ))}
                    </div>
                  ) : field.type === 'slider' ? (
                    <div className="h-2 bg-gray-200 rounded-full mt-2"><div className="h-2 bg-primary-400 rounded-full w-1/2" /></div>
                  ) : field.type === 'image' || field.type === 'file' ? (
                    <div className="h-20 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
                      <Upload className="w-4 h-4 text-gray-300" />
                    </div>
                  ) : (
                    <div className="h-9 bg-gray-50 rounded border border-gray-100" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function FormBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [schema, setSchema] = useState({ steps: [] })
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState('editor') // editor | preview
  const [showAddField, setShowAddField] = useState(null) // stepIndex

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getForm(id)
        setForm(data)
        setName(data.name)
        setDescription(data.description || '')
        setSchema(data.schema || { steps: [] })
      } catch (err) {
        alert(err.message)
        navigate('/admin/formularios')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, navigate])

  const save = async () => {
    setSaving(true)
    try {
      // Clean _id from fields before saving
      const cleanSchema = {
        steps: schema.steps.map(step => ({
          ...step,
          fields: step.fields.map(({ _id, ...field }) => field)
        }))
      }
      await api.updateForm(id, { name, description, schema: cleanSchema })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const addStep = () => {
    const newStep = {
      id: `step${schema.steps.length + 1}`,
      title: `Etapa ${schema.steps.length + 1}`,
      description: '',
      fields: []
    }
    setSchema({ ...schema, steps: [...schema.steps, newStep] })
  }

  const updateStep = (index, updated) => {
    const steps = [...schema.steps]
    steps[index] = updated
    setSchema({ ...schema, steps })
  }

  const deleteStep = (index) => {
    if (schema.steps.length <= 1) return
    const steps = schema.steps.filter((_, i) => i !== index)
    setSchema({ ...schema, steps })
  }

  const addField = (stepIndex, type) => {
    const steps = [...schema.steps]
    const newField = {
      _id: generateId(),
      key: '',
      label: '',
      type,
      width: '100',
      required: false,
      placeholder: '',
    }
    if (type === 'select' || type === 'radio' || type === 'choice') {
      newField.options = ['Opção 1', 'Opção 2']
    }
    if (type === 'slider') {
      newField.min = 0
      newField.max = 100
      newField.step = 1
    }
    steps[stepIndex] = { ...steps[stepIndex], fields: [...steps[stepIndex].fields, newField] }
    setSchema({ ...schema, steps })
    setShowAddField(null)
  }

  if (loading) {
    return (
      <AdminLayout title="Form Builder">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title={name || 'Form Builder'}>
      {/* Back + Name + Save */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/admin/formularios')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="text-xl font-bold text-gray-900 bg-transparent border-0 p-0 focus:ring-0 w-full"
            placeholder="Nome do formulário"
          />
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="text-sm text-gray-400 bg-transparent border-0 p-0 focus:ring-0 w-full mt-0.5"
            placeholder="Descrição do formulário"
          />
        </div>
        <button
          onClick={save}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all flex-shrink-0 ${
            saved
              ? 'bg-green-50 text-green-600 border border-green-200'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? '✓ Salvo' : <><Save className="w-4 h-4" /> Salvar</>}
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('editor')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'editor' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings className="w-4 h-4" />
          Editor
        </button>
        <button
          onClick={() => setTab('preview')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
      </div>

      {tab === 'editor' ? (
        <div className="space-y-4">
          {schema.steps.map((step, si) => (
            <StepEditor
              key={step.id || si}
              step={step}
              stepIndex={si}
              totalSteps={schema.steps.length}
              onUpdate={(updated) => updateStep(si, updated)}
              onDelete={() => deleteStep(si)}
              onAddField={() => setShowAddField(si)}
            />
          ))}

          <button
            onClick={addStep}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-medium text-gray-400 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Adicionar etapa
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">{name || 'Formulário'}</h2>
          {description && <p className="text-sm text-gray-400 mb-6">{description}</p>}
          <FormPreview schema={schema} />
          {schema.steps.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-10">Adicione etapas e campos no Editor para visualizar o preview.</p>
          )}
        </div>
      )}

      {/* Add field modal */}
      {showAddField !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Adicionar campo</h3>
              <button onClick={() => setShowAddField(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {FIELD_TYPES.map(ft => (
                <button
                  key={ft.type}
                  onClick={() => addField(showAddField, ft.type)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all text-left"
                >
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ft.icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ft.label}</p>
                    <p className="text-[10px] text-gray-400">{ft.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
