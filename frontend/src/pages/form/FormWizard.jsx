import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  Leaf, ArrowLeft, ArrowRight, Check, Plus, Trash2,
  AlertCircle, Loader2, Image as ImageIcon, CheckCircle2,
  Pencil, RefreshCw, ThumbsUp, RotateCcw, ExternalLink, X
} from 'lucide-react'
import * as api from '../../services/api.js'

// ---- Field Components ----

function TextField({ field, value, onChange, disabled }) {
  const maxLen = field.maxLength || field.max_length
  return (
    <div className="space-y-1.5">
      <textarea
        id={field.key}
        value={value || ''}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder={field.placeholder || ''}
        maxLength={maxLen || undefined}
        rows={field.rows || 4}
        disabled={disabled}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors resize-none bg-white"
      />
      {maxLen && (
        <p className="text-right text-xs text-gray-400">
          {(value || '').length}/{maxLen}
        </p>
      )}
    </div>
  )
}

function InputField({ field, value, onChange, disabled }) {
  const maxLen = field.maxLength || field.max_length
  return (
    <input
      id={field.key}
      type={field.type}
      value={value || ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      placeholder={field.placeholder || ''}
      maxLength={maxLen || undefined}
      min={field.min}
      max={field.max}
      disabled={disabled}
      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors bg-white"
    />
  )
}

function ImageField({ field, value, onUpload, token, disabled }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione uma imagem válida')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Imagem muito grande. Máximo 10MB')
      return
    }
    setError('')
    setUploading(true)
    try {
      const result = await api.uploadFile(token, field.key, file)
      onUpload(field.key, result.url || result.path || value)
    } catch (err) {
      setError(err.message || 'Erro ao fazer upload')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative group rounded-xl overflow-hidden border-2 border-primary-200 bg-gray-50">
          <img
            src={value.startsWith('http') ? value : `/${value}`}
            alt="Preview"
            className="w-full max-h-64 object-contain"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={disabled || uploading}
              className="px-4 py-2 bg-white text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Trocar imagem
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
            dragOver
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          } ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
              <p className="text-gray-500 font-medium">Enviando imagem...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                <ImageIcon className="w-7 h-7 text-gray-400" />
              </div>
              <div>
                <p className="text-gray-700 font-medium">Clique para selecionar ou arraste aqui</p>
                <p className="text-gray-400 text-sm mt-1">PNG, JPG, WEBP — máximo 10MB</p>
              </div>
            </div>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
        disabled={disabled || uploading}
      />
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4" /> {error}
        </p>
      )}
    </div>
  )
}

function FileOrLinkField({ field, value, onUpload, onChange, token, disabled, linkValue = '' }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const inputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 10MB')
      return
    }
    setError('')
    setUploading(true)
    setFileName(file.name)
    try {
      const result = await api.uploadFile(token, field.key, file)
      onUpload(field.key, result.url || result.path || value)
    } catch (err) {
      setError(err.message || 'Erro ao fazer upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {value ? (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm font-medium text-green-800 truncate flex-1">{fileName || 'Arquivo enviado'}</p>
          <button onClick={() => { onUpload(field.key, ''); setFileName('') }} disabled={disabled} className="text-sm text-green-600 hover:text-red-500 font-medium">Remover</button>
        </div>
      ) : (
        <div
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all border-gray-300 hover:border-primary-400 hover:bg-gray-50 ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              <p className="text-gray-500 text-sm">Enviando...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              <p className="text-gray-700 text-sm font-medium">Clique para selecionar ou arraste</p>
              <p className="text-gray-400 text-xs">PDF, PNG, JPG — máximo 10MB</p>
            </div>
          )}
        </div>
      )}
      <input ref={inputRef} type="file" accept={field.accept || '.pdf,image/*'} className="hidden" onChange={(e) => handleFile(e.target.files[0])} disabled={disabled || uploading} />

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">ou</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <input
        type="url"
        value={linkValue}
        onChange={(e) => onChange(field.link_key, e.target.value)}
        placeholder={field.link_placeholder || 'Cole o link aqui...'}
        disabled={disabled}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors bg-white text-sm"
      />
      {error && <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> {error}</p>}
    </div>
  )
}

function FileField({ field, value, onUpload, token, disabled }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const inputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 10MB')
      return
    }
    setError('')
    setUploading(true)
    setFileName(file.name)
    try {
      const result = await api.uploadFile(token, field.key, file)
      onUpload(field.key, result.url || result.path || value)
    } catch (err) {
      setError(err.message || 'Erro ao fazer upload')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-3">
      {value ? (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800 truncate">{fileName || 'Arquivo enviado'}</p>
          </div>
          <button
            onClick={() => { onUpload(field.key, ''); setFileName('') }}
            disabled={disabled}
            className="text-sm text-green-600 hover:text-red-500 font-medium transition-colors"
          >
            Remover
          </button>
        </div>
      ) : (
        <div
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 border-gray-300 hover:border-primary-400 hover:bg-gray-50 ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
              <p className="text-gray-500 font-medium">Enviando arquivo...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              <div>
                <p className="text-gray-700 font-medium">Clique para selecionar ou arraste aqui</p>
                <p className="text-gray-400 text-sm mt-1">PDF, PNG, JPG — máximo 10MB</p>
              </div>
            </div>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={field.accept || '.pdf,image/*'}
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
        disabled={disabled || uploading}
      />
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4" /> {error}
        </p>
      )}
    </div>
  )
}

function ListField({ field, value, onChange, token, disabled }) {
  const items = Array.isArray(value) ? value : []
  const subFields = field.fields || field.sub_fields || field.itemFields || []

  const addItem = () => {
    const newItem = {}
    subFields.forEach((sf) => { newItem[sf.key] = '' })
    onChange(field.key, [...items, newItem])
  }

  const removeItem = (idx) => {
    onChange(field.key, items.filter((_, i) => i !== idx))
  }

  const updateItem = (idx, subKey, subValue) => {
    const updated = items.map((item, i) =>
      i === idx ? { ...item, [subKey]: subValue } : item
    )
    onChange(field.key, updated)
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">{field.item_label || 'Item'} {idx + 1}</span>
            <button
              onClick={() => removeItem(idx)}
              disabled={disabled}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          {subFields.map((sf) => (
            <div key={sf.key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{sf.label}</label>
              {sf.type === 'textarea' ? (
                <textarea
                  value={item[sf.key] || ''}
                  onChange={(e) => updateItem(idx, sf.key, e.target.value)}
                  placeholder={sf.placeholder || ''}
                  rows={3}
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                />
              ) : sf.type === 'image' ? (
                <ImageField
                  field={{ ...sf, key: `${field.key}_${idx}_${sf.key}` }}
                  value={item[sf.key] || ''}
                  onUpload={(_, url) => updateItem(idx, sf.key, url)}
                  token={token}
                  disabled={disabled}
                />
              ) : (
                <input
                  type={sf.type || 'text'}
                  value={item[sf.key] || ''}
                  onChange={(e) => updateItem(idx, sf.key, e.target.value)}
                  placeholder={sf.placeholder || ''}
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                />
              )}
            </div>
          ))}
        </div>
      ))}

      <button
        onClick={addItem}
        disabled={disabled || (field.max_items && items.length >= field.max_items)}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="w-4 h-4" />
        {field.add_label || 'Adicionar item'}
        {field.max_items ? ` (${items.length}/${field.max_items})` : ''}
      </button>
    </div>
  )
}

function ColorChoiceField({ field, value, onChange, disabled }) {
  const options = field.options || []
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => {
        const optValue = opt.value || opt.hex || opt
        const optLabel = opt.label || opt.name || optValue
        const optColor = opt.hex || opt.color || optValue
        const isSelected = value === optValue
        return (
          <button
            key={optValue}
            onClick={() => onChange(field.key, optValue)}
            disabled={disabled}
            title={optLabel}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 transition-all duration-150 ${
              isSelected
                ? 'border-primary-500 bg-primary-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div
              className="w-6 h-6 rounded-full border border-gray-200 flex-shrink-0"
              style={{ backgroundColor: optColor }}
            />
            <span className={`text-sm font-medium ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>
              {optLabel}
            </span>
            {isSelected && <Check className="w-4 h-4 text-primary-600 ml-1" />}
          </button>
        )
      })}
    </div>
  )
}

function ChoiceField({ field, value, onChange, disabled }) {
  const options = field.options || []
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map((opt) => {
        const optValue = opt.value || opt
        const optLabel = opt.label || opt.name || optValue
        const optDesc = opt.description || opt.desc
        const isSelected = value === optValue
        return (
          <button
            key={optValue}
            onClick={() => onChange(field.key, optValue)}
            disabled={disabled}
            className={`text-left px-4 py-4 rounded-xl border-2 transition-all duration-150 ${
              isSelected
                ? 'border-primary-500 bg-primary-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
              }`}>
                {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <div>
                <p className={`text-sm font-medium ${isSelected ? 'text-primary-700' : 'text-gray-800'}`}>
                  {optLabel}
                </p>
                {optDesc && <p className="text-xs text-gray-500 mt-0.5">{optDesc}</p>}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function ToggleField({ field, value, onChange, disabled }) {
  const isOn = value === true || value === 'true' || value === 'sim'
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(field.key, !isOn)}
      disabled={disabled}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        isOn ? 'bg-primary-600' : 'bg-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          isOn ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

function FieldRenderer({ field, value, onChange, token, disabled, formData }) {
  const type = field.type

  if (type === 'textarea') {
    return <TextField field={field} value={value} onChange={onChange} disabled={disabled} />
  }
  if (type === 'image') {
    return <ImageField field={field} value={value} onUpload={onChange} token={token} disabled={disabled} />
  }
  if (type === 'file') {
    return <FileField field={field} value={value} onUpload={onChange} token={token} disabled={disabled} />
  }
  if (type === 'file-or-link') {
    const linkVal = field.link_key && formData ? (formData[field.link_key] || '') : ''
    return <FileOrLinkField field={field} value={value} onUpload={onChange} onChange={onChange} token={token} disabled={disabled} linkValue={linkVal} />
  }
  if (type === 'list') {
    return <ListField field={field} value={value} onChange={onChange} token={token} disabled={disabled} />
  }
  if (type === 'toggle') {
    return <ToggleField field={field} value={value} onChange={onChange} disabled={disabled} />
  }
  if (type === 'info') {
    return (
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 leading-relaxed">{field.text}</p>
      </div>
    )
  }
  if (type === 'color') {
    const colorVal = value || '#2D6A4F'
    // Set default value in formData if not present
    if (!value) {
      setTimeout(() => onChange(field.key, colorVal), 0)
    }
    return (
      <div className="flex items-center gap-4">
        <input
          type="color"
          value={colorVal}
          onChange={(e) => onChange(field.key, e.target.value)}
          disabled={disabled}
          className="w-14 h-14 rounded-xl border-2 border-gray-200 cursor-pointer p-1 bg-white"
        />
        <div className="space-y-1">
          <span className="text-sm font-medium text-gray-700">{colorVal}</span>
          <p className="text-xs text-gray-400">Clique no quadrado para escolher</p>
        </div>
      </div>
    )
  }
  if (type === 'color-choice' || type === 'color_choice') {
    return <ColorChoiceField field={field} value={value} onChange={onChange} disabled={disabled} />
  }
  if (type === 'choice' || type === 'radio') {
    return <ChoiceField field={field} value={value} onChange={onChange} disabled={disabled} />
  }
  // text, email, tel, url, number, etc.
  return <InputField field={field} value={value} onChange={onChange} disabled={disabled} />
}

// ---- Condition evaluation ----
function evaluateCondition(condition, formData) {
  if (!condition) return true
  const { field, operator, value } = condition
  const fieldValue = formData[field]
  switch (operator) {
    case 'equals': case '==': case 'eq': {
      if (value === true || value === 'true') return fieldValue === true || fieldValue === 'true' || fieldValue === 'sim'
      if (value === false || value === 'false') return fieldValue === false || fieldValue === 'false' || !fieldValue
      return fieldValue == value
    }
    case 'not_equals': case '!=': case 'ne': return fieldValue != value
    case 'contains': return String(fieldValue || '').includes(value)
    case 'not_empty': case 'exists': return !!fieldValue && fieldValue !== ''
    case 'empty': return !fieldValue || fieldValue === ''
    default: return fieldValue == value
  }
}

function isFieldVisible(field, formData) {
  // Support string conditional format: "key=value"
  if (field.conditional) {
    const [condKey, condVal] = field.conditional.split('=')
    return formData[condKey] === condVal
  }
  if (!field.condition && !field.show_if) return true
  const condition = field.condition || field.show_if
  if (Array.isArray(condition)) {
    return condition.every((c) => evaluateCondition(c, formData))
  }
  return evaluateCondition(condition, formData)
}

// ---- Success Screen ----
function SuccessScreen({ clientName, wasEdit }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="relative inline-flex">
          <div className="w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center shadow-2xl shadow-primary-500/40 mb-6">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-lg animate-bounce">
            🎉
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">
          {wasEdit ? 'Respostas atualizadas!' : 'Formulário enviado!'}
        </h1>
        <p className="text-primary-200 text-lg leading-relaxed">
          {clientName ? `Obrigado, ${clientName}!` : 'Obrigado!'}{' '}
          {wasEdit
            ? 'Suas respostas foram atualizadas com sucesso.'
            : 'Recebemos todas as suas informações. Nossa equipe irá analisar e entrar em contato em breve.'}
        </p>
      </div>
    </div>
  )
}

// ---- Locked screen (status avançado, não pode mais editar) ----
function LockedScreen({ clientName, status }) {
  const messages = {
    em_edicao: { title: 'Seu site está sendo criado', sub: 'Nossa equipe já está trabalhando no seu projeto!' },
    aguardando_aprovacao: { title: 'Aguardando sua aprovação', sub: 'Em breve você receberá o link para revisar o site.' },
    alteracao_solicitada: { title: 'Alterações sendo realizadas', sub: 'Nossa equipe está ajustando o site conforme solicitado.' },
    aprovado: { title: 'Site aprovado!', sub: 'Seu site foi aprovado e em breve será publicado.' },
    publicado: { title: 'Site publicado!', sub: 'Seu site já está no ar. Parabéns!' },
  }
  const { title, sub } = messages[status] || { title: 'Formulário enviado', sub: 'Seus dados foram recebidos com sucesso.' }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center shadow-2xl shadow-primary-500/40 mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">{title}</h1>
        <p className="text-primary-200 text-lg">
          {clientName ? `${clientName}, ` : ''}{sub}
        </p>
      </div>
    </div>
  )
}

// Flattens {brand: {name: "X"}} → {"brand.name": "X"}, keeps arrays as-is
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

// ---- Main FormWizard ----
export default function FormWizard() {
  const { token } = useParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [schema, setSchema] = useState(null)
  const [client, setClient] = useState(null)
  const [formData, setFormData] = useState({})
  const [currentStep, setCurrentStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [animDir, setAnimDir] = useState('forward')
  const [isEditing, setIsEditing] = useState(false)
  const [panelOpenState, setPanelOpenState] = useState(true)
  // Review states
  const [reviewActionState, setReviewActionState] = useState(null) // null | 'approved' | 'revision'
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [showRevisionForm, setShowRevisionForm] = useState(false)
  const [revisionMessage, setRevisionMessage] = useState('')

  const storageKey = `form_wizard_${token}`
  const previewIframeRef = useRef(null)
  const [hoveredSection, setHoveredSection] = useState(null)

  // Step ID → template section mapping
  const STEP_TO_SECTION = {
    negocio: '#inicio',
    fotos: '#inicio',
    sobre: '#sobre',
    servicos: '#servicos',
    depoimentos: '#depoimentos',
    faq: '#faq',
    contato: '#contato',
    redes: '#contato',
    preferencias: null,
  }

  const sendPreviewMessage = useCallback((msg) => {
    if (previewIframeRef.current?.contentWindow) {
      previewIframeRef.current.contentWindow.postMessage(msg, '*')
    }
  }, [])

  const handleFieldHover = useCallback((stepId, entering) => {
    const section = STEP_TO_SECTION[stepId]
    if (!section) return
    if (entering) {
      setHoveredSection(section)
      sendPreviewMessage({ action: 'highlight', section })
    } else {
      setHoveredSection(null)
      sendPreviewMessage({ action: 'unhighlight' })
    }
  }, [sendPreviewMessage])

  useEffect(() => {
    async function loadSchema() {
      try {
        const data = await api.getFormSchema(token)
        setSchema(data.schema)
        setClient(data.client)

        // Initialize form data — flatten nested keys (brand.name, hero.image, etc.)
        const flatFormData = data.form_data ? flattenObject(data.form_data) : {}
        let initial = {}

        if (Object.keys(flatFormData).length > 0) {
          // Server has data — use it as source of truth and clear local draft
          initial = { ...flatFormData }
          localStorage.removeItem(storageKey)
        } else {
          // No server data — use local draft if available
          const saved = localStorage.getItem(storageKey)
          initial = saved ? JSON.parse(saved) : {}
        }

        // Pre-fill uploads into formData
        if (data.uploads) {
          Object.assign(initial, data.uploads)
        }

        setFormData(initial)
      } catch (err) {
        setError(err.message || 'Erro ao carregar formulário')
      } finally {
        setLoading(false)
      }
    }
    loadSchema()
  }, [token])

  // Auto-save every 30s
  useEffect(() => {
    if (!schema) return
    const interval = setInterval(() => {
      localStorage.setItem(storageKey, JSON.stringify(formData))
    }, 30000)
    return () => clearInterval(interval)
  }, [formData, schema, storageKey])

  const steps = schema?.steps || []
  const totalSteps = steps.length

  const handleChange = useCallback((key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }, [])

  const getVisibleFields = useCallback((step) => {
    return (step.fields || []).filter((f) => isFieldVisible(f, formData))
  }, [formData])

  const isStepValid = useCallback((stepIndex) => {
    const step = steps[stepIndex]
    if (!step) return true
    const visibleFields = getVisibleFields(step)
    return visibleFields.every((field) => {
      if (!field.required) return true
      const val = formData[field.key]
      if (field.type === 'list') return Array.isArray(val) && val.length > 0
      return val !== undefined && val !== null && val !== ''
    })
  }, [steps, formData, getVisibleFields])

  const scrollPreviewToStep = useCallback((stepIndex) => {
    const stepId = steps[stepIndex]?.id
    const section = STEP_TO_SECTION[stepId]
    if (section) {
      sendPreviewMessage({ action: 'scrollTo', section })
    }
  }, [steps, sendPreviewMessage])

  const goNext = () => {
    if (currentStep < totalSteps - 1) {
      setAnimDir('forward')
      const next = currentStep + 1
      setCurrentStep(next)
      scrollPreviewToStep(next)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goBack = () => {
    if (currentStep > 0) {
      setAnimDir('backward')
      const prev = currentStep - 1
      setCurrentStep(prev)
      scrollPreviewToStep(prev)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    localStorage.setItem(storageKey, JSON.stringify(formData))
    try {
      await api.submitForm(token, formData)
      localStorage.removeItem(storageKey)
      setIsEditing(false)
      setSubmitted(true)
    } catch (err) {
      alert(err.message || 'Erro ao enviar formulário. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReviewApprove = async () => {
    setReviewSubmitting(true); setReviewError('')
    try {
      await api.approveReview(token, 'approve', '')
      setReviewActionState('approved')
    } catch (err) { setReviewError(err.message || 'Erro ao aprovar') }
    finally { setReviewSubmitting(false) }
  }

  const handleReviewRevision = async () => {
    if (!revisionMessage.trim()) { setReviewError('Descreva as alterações desejadas'); return }
    setReviewSubmitting(true); setReviewError('')
    try {
      await api.approveReview(token, 'request_revision', revisionMessage.trim())
      setReviewActionState('revision')
    } catch (err) { setReviewError(err.message || 'Erro ao enviar') }
    finally { setReviewSubmitting(false) }
  }

  // --- Render states ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-950 to-primary-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-primary-200 font-medium">Carregando formulário...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-950 to-primary-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Link inválido</h2>
          <p className="text-primary-200">{error}</p>
        </div>
      </div>
    )
  }

  const status = client?.status || 'formulario_pendente'
  const canEdit = status === 'formulario_preenchido'
  const hasFilled = status !== 'formulario_pendente'
  const needsReview = status === 'aguardando_aprovacao'

  // Status info for the summary banner
  const STATUS_INFO = {
    formulario_preenchido: { label: 'Formulário enviado', color: 'bg-green-50 border-green-200 text-green-700' },
    em_edicao:            { label: 'Seu site está sendo criado', color: 'bg-blue-50 border-blue-200 text-blue-700' },
    aguardando_aprovacao: { label: 'Aguardando sua aprovação', color: 'bg-amber-50 border-amber-200 text-amber-700' },
    alteracao_solicitada: { label: 'Alterações sendo realizadas', color: 'bg-orange-50 border-orange-200 text-orange-700' },
    aprovado:             { label: 'Site aprovado!', color: 'bg-green-50 border-green-200 text-green-700' },
    publicado:            { label: 'Site publicado!', color: 'bg-green-50 border-green-200 text-green-700' },
  }

  if (reviewActionState === 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Site aprovado!</h1>
          <p className="text-gray-500">Nossa equipe foi notificada e irá publicar seu site em breve.</p>
        </div>
      </div>
    )
  }

  if (reviewActionState === 'revision') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Alterações enviadas!</h1>
          <p className="text-gray-500">Nossa equipe recebeu sua solicitação e irá realizar os ajustes.</p>
        </div>
      </div>
    )
  }

  // Show summary for any status where form was already filled
  if (hasFilled && !isEditing && !submitted) {
    const statusInfo = STATUS_INFO[status] || STATUS_INFO.formulario_preenchido
    const showSplitPreview = status !== 'formulario_preenchido'
    const previewUrl = `http://localhost:3000/api/preview.php?token=${token}`

    const renderValue = (val) => {
      if (val === null || val === undefined || val === '') return null

      const isImg = typeof val === 'string' && (val.startsWith('uploads/') || /\.(jpg|png|webp|avif)$/i.test(val))
      if (isImg) {
        return <img src={`http://localhost:3000/${val}`} alt="" className="h-20 w-auto rounded-lg object-cover border border-gray-100 mt-1" />
      }

      if (Array.isArray(val)) {
        return (
          <div className="space-y-2 mt-1 w-full">
            {val.map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-lg px-3 py-2.5 space-y-1">
                {typeof item === 'object' && item !== null
                  ? Object.entries(item).map(([k, v]) => {
                      if (!v && v !== 0) return null
                      const subIsImg = typeof v === 'string' && (v.startsWith('uploads/') || /\.(jpg|png|webp|avif)$/i.test(v))
                      const SUB_LABELS = { text: 'Depoimento', name: 'Nome', detail: 'Detalhe', question: 'Pergunta', answer: 'Resposta', title: 'Título', description: 'Descrição' }
                      return (
                        <div key={k} className="flex gap-2 text-sm">
                          <span className="text-gray-400 flex-shrink-0 w-28 capitalize">{SUB_LABELS[k] || k.replace(/_/g, ' ')}</span>
                          {subIsImg
                            ? <img src={`http://localhost:3000/${v}`} alt={k} className="h-12 w-auto rounded object-cover border border-gray-100" />
                            : <span className="text-gray-700 break-words">{String(v)}</span>
                          }
                        </div>
                      )
                    })
                  : <span className="text-sm text-gray-700">{String(item)}</span>
                }
              </div>
            ))}
          </div>
        )
      }

      // Color hex
      if (typeof val === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(val)) {
        return (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg border border-gray-200 shadow-sm" style={{ backgroundColor: val }} />
            <span className="text-gray-700 text-sm font-mono">{val}</span>
          </div>
        )
      }

      // Boolean
      if (val === true || val === 'true') return <span className="text-green-600 text-sm font-medium">Sim</span>
      if (val === false || val === 'false') return <span className="text-gray-400 text-sm">Não</span>

      return <span className="text-gray-700 break-words text-sm">{String(val)}</span>
    }

    const summaryCards = (
      <div className="space-y-4">
        {(schema?.steps || []).map((step, stepIdx) => {
          const fields = (step.fields || []).filter((f) => {
            if (f.key.endsWith('_suggest') || f.type === 'info-button') return false
            const val = formData[f.key]
            return val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && val.length === 0)
          })
          // Check for suggest flags in this step
          const suggestFields = (step.fields || []).filter(f => {
            const suggestKey = f.key + '_suggest'
            return formData[suggestKey] === true
          })
          if (!fields.length && !suggestFields.length) return null
          return (
            <div key={step.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">{step.title}</h2>
                {canEdit && (
                  <button
                    onClick={() => { setIsEditing(true); setCurrentStep(stepIdx) }}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 hover:underline"
                  >
                    <Pencil className="w-3 h-3" /> Editar
                  </button>
                )}
              </div>
              <div className="px-6 py-4 divide-y divide-gray-50">
                {fields.map((field) => {
                  const val = formData[field.key]
                  const isListOrImg = Array.isArray(val) ||
                    (typeof val === 'string' && (val.startsWith('uploads/') || /\.(jpg|png|webp|avif)$/i.test(val)))
                  const isLongValue = typeof val === 'string' && val.length > 40
                  const useBlock = isListOrImg || isLongValue
                  return (
                    <div key={field.key} className={`py-3 first:pt-0 last:pb-0 ${useBlock ? 'space-y-1.5' : 'flex gap-4 items-start'}`}>
                      <span className={`text-gray-400 text-sm ${useBlock ? 'block' : 'flex-shrink-0 w-40'}`}>
                        {field.label}
                      </span>
                      <span className="min-w-0 break-words">{renderValue(val)}</span>
                    </div>
                  )
                })}
                {suggestFields.map((field) => (
                  <div key={field.key + '_suggest'} className="py-3">
                    <span className="text-gray-400 text-sm block mb-1.5">{field.label}</span>
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-lg">
                      <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.5v1h-4v-1C8.8 8.8 8 7.5 8 6a4 4 0 0 1 4-4z"/><rect x="9" y="13" width="6" height="3" rx="1"/><path d="M10 16v1a2 2 0 0 0 4 0v-1"/></svg>
                      <span className="text-sm text-blue-700">Sugestões solicitadas ao desenvolvedor</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )

    if (showSplitPreview) {
      const [panelOpen, setPanelOpen] = [panelOpenState, setPanelOpenState]
      return (
        <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-gray-100 relative">
          {/* iframe preview — always full on mobile, flex-1 on desktop */}
          <div className={`bg-white border-r border-gray-200 flex flex-col ${panelOpen ? 'hidden lg:flex lg:flex-1' : 'flex-1'}`}>
            <iframe
              src={previewUrl}
              className="flex-1 w-full border-0"
              title="Preview do Site"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>

          {/* Toggle button when panel is closed */}
          {!panelOpen && (
            <button
              onClick={() => setPanelOpen(true)}
              className="absolute top-4 right-6 flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg text-xs font-semibold text-gray-700 hover:bg-white transition-all z-10"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Ver Respostas do Formulário
            </button>
          )}

          {/* Right — summary + actions (collapsible) */}
          {panelOpen && (
            <div className="w-full h-full lg:w-[440px] xl:w-[480px] flex-shrink-0 bg-gray-50 flex flex-col overflow-hidden absolute inset-0 lg:static lg:inset-auto">
              {/* Status banner */}
              <div className={`flex items-center justify-between gap-3 px-5 py-4 border-b ${statusInfo.color}`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-xs">{statusInfo.label}</p>
                    <p className="text-xs opacity-75 truncate">{client?.name || 'Cliente'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {canEdit && (
                    <button
                      onClick={() => { setIsEditing(true); setCurrentStep(0) }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-current/20 rounded-lg text-xs font-medium hover:bg-white/80 transition-colors"
                    >
                      <Pencil className="w-3 h-3" /> Editar
                    </button>
                  )}
                  <button
                    onClick={() => setPanelOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
                    title="Fechar painel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Approval actions for aguardando_aprovacao */}
              {needsReview && (
                <div className="px-4 py-4 bg-white border-b border-gray-200 flex-shrink-0">
                  {!showRevisionForm ? (
                    <div className="space-y-2">
                      <button onClick={handleReviewApprove} disabled={reviewSubmitting}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-sm transition-all text-sm">
                        {reviewSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                        Aprovar Site
                      </button>
                      <button onClick={() => setShowRevisionForm(true)} disabled={reviewSubmitting}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 font-semibold rounded-xl transition-all text-sm">
                        <RotateCcw className="w-4 h-4" /> Solicitar Alteração
                      </button>
                      {reviewError && (
                        <p className="text-red-600 text-xs flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{reviewError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button onClick={() => { setShowRevisionForm(false); setReviewError('') }}
                        className="text-xs text-gray-400 hover:text-gray-600">← Voltar</button>
                      <textarea
                        value={revisionMessage} onChange={(e) => setRevisionMessage(e.target.value)}
                        placeholder="Descreva as alterações desejadas..."
                        rows={3} disabled={reviewSubmitting}
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors resize-none text-sm"
                      />
                      {reviewError && (
                        <p className="text-red-600 text-xs flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{reviewError}
                        </p>
                      )}
                      <button onClick={handleReviewRevision} disabled={reviewSubmitting || !revisionMessage.trim()}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-sm">
                        {reviewSubmitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Enviando...</> : <><RotateCcw className="w-3.5 h-3.5" />Enviar Solicitação</>}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Scrollable summary */}
              <div className="flex-1 overflow-y-auto p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Respostas enviadas</p>
                {summaryCards}
              </div>
            </div>
          )}
        </div>
      )
    }

    // formulario_preenchido — full width (no preview yet)
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">{statusInfo.label}</h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {client?.name ? `${client.name} — ` : ''}Suas respostas foram recebidas com sucesso.
                  </p>
                </div>
              </div>
              {canEdit && (
                <button
                  onClick={() => { setIsEditing(true); setCurrentStep(0) }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all"
                >
                  <Pencil className="w-4 h-4" />
                  Editar respostas
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
          {summaryCards}
        </main>
      </div>
    )
  }

  if (submitted) {
    return <SuccessScreen clientName={client?.name} wasEdit={canEdit} />
  }

  if (!steps.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-950 to-primary-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Schema sem etapas</h2>
          <p className="text-primary-200">O formulário não possui etapas configuradas.</p>
        </div>
      </div>
    )
  }

  const step = steps[currentStep]
  const visibleFields = getVisibleFields(step)
  const isLast = currentStep === totalSteps - 1
  const canProceed = isStepValid(currentStep)
  const progress = ((currentStep + 1) / totalSteps) * 100

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <span className="font-semibold text-gray-900 text-[15px]">Formulário de Briefing</span>
          <span className="text-sm text-gray-500">
            Etapa <span className="font-semibold text-gray-900">{currentStep + 1}</span> de{' '}
            <span className="font-semibold text-gray-900">{totalSteps}</span>
          </span>
        </div>
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-primary-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Editing banner */}
      {canEdit && isEditing && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-700 text-sm">
              <Pencil className="w-4 h-4 flex-shrink-0" />
              <span>Você está <strong>editando</strong> suas respostas. Navegue pelas etapas e clique em <strong>Atualizar</strong> na última.</span>
            </div>
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs text-amber-600 hover:underline flex-shrink-0"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
        <div key={currentStep} className="page-enter">
          {/* Step header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full mb-4">
              Etapa {currentStep + 1}/{totalSteps}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {step.title}
            </h1>
            {step.description && (
              <p className="mt-2 text-gray-500 leading-relaxed">{step.description}</p>
            )}
          </div>

          {/* Fields */}
          <div className="space-y-7">
            {visibleFields.map((field) => {
              if (field.type === 'info') {
                return (
                  <div key={field.key}>
                    <FieldRenderer field={field} value={formData[field.key]} onChange={handleChange} token={token} disabled={submitting} formData={formData} />
                  </div>
                )
              }
              if (field.type === 'toggle') {
                const isOn = formData[field.key] === true || formData[field.key] === 'true' || formData[field.key] === 'sim'
                return (
                  <div key={field.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <label htmlFor={field.key} className="text-base font-semibold text-gray-900">
                        {field.label}
                      </label>
                      <FieldRenderer field={field} value={formData[field.key]} onChange={handleChange} token={token} disabled={submitting} formData={formData} />
                    </div>
                    {isOn && field.on_field && (
                      <div className="pt-2 border-t border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.on_field.label}</label>
                        <input
                          type={field.on_field.type || 'text'}
                          value={formData[field.on_field.key] || ''}
                          onChange={(e) => handleChange(field.on_field.key, e.target.value)}
                          placeholder={field.on_field.placeholder || ''}
                          disabled={submitting}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors bg-white"
                        />
                      </div>
                    )}
                    {!isOn && field.off_text && (
                      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-700 leading-relaxed">{field.off_text}</p>
                      </div>
                    )}
                  </div>
                )
              }
              const hasSuggest = field.type === 'list' && field.suggest
              const suggestActive = hasSuggest && formData[field.key + '_suggest'] === true
              return (
                <div key={field.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className={`flex items-center ${hasSuggest ? 'justify-between' : ''} mb-1`}>
                    {field.label && (
                      <label
                        htmlFor={field.key}
                        className="block text-base font-semibold text-gray-900"
                      >
                        {field.label}
                        {field.required && (
                          <span className="text-red-500 ml-1 text-sm">*</span>
                        )}
                      </label>
                    )}
                    {hasSuggest && (
                      <button
                        type="button"
                        onClick={() => handleChange(field.key + '_suggest', !suggestActive)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                          suggestActive
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                            : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 hover:from-indigo-100 hover:to-purple-100 hover:shadow-sm'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.5v1h-4v-1C8.8 8.8 8 7.5 8 6a4 4 0 0 1 4-4z"/>
                          <rect x="9" y="13" width="6" height="3" rx="1"/>
                          <path d="M10 16v1a2 2 0 0 0 4 0v-1"/>
                        </svg>
                        {field.suggest.label}
                      </button>
                    )}
                  </div>
                  {field.description && (
                    <p className="text-sm text-gray-500 mb-4 leading-relaxed">{field.description}</p>
                  )}
                  {suggestActive ? (
                    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-700 leading-relaxed">{field.suggest.info_text}</p>
                    </div>
                  ) : (
                    <FieldRenderer
                      field={field}
                      value={formData[field.key]}
                      onChange={handleChange}
                      token={token}
                      disabled={submitting}
                      formData={formData}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={goBack}
            disabled={currentStep === 0 || submitting}
            className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={!canProceed || submitting}
              className="btn-primary px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{canEdit ? 'Atualizando...' : 'Enviando...'}</>
              ) : canEdit ? (
                <><RefreshCw className="w-4 h-4" /> Atualizar respostas</>
              ) : (
                <><Check className="w-4 h-4" /> Enviar Formulário</>
              )}
            </button>
          ) : (
            <button
              onClick={goNext}
              disabled={!canProceed || submitting}
              className="btn-primary px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Required hint */}
        {!canProceed && (
          <p className="text-center text-sm text-amber-600 mt-4 flex items-center justify-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            Preencha todos os campos obrigatórios para continuar
          </p>
        )}
      </main>
    </div>
  )
}
