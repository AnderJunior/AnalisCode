import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Layout, Plus, X, Loader2, AlertCircle,
  Upload, Trash2, Globe, Image as ImageIcon, Search, ExternalLink, Pencil
} from 'lucide-react'
import AdminLayout from '../../components/AdminLayout.jsx'
import * as api from '../../services/api.js'

function CreateTemplateModal({ onClose, onSuccess }) {
  const [name, setName] = useState('')
  const [niche, setNiche] = useState('')
  const [zipFile, setZipFile] = useState(null)
  const [thumbnail, setThumbnail] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const zipInputRef = useRef()
  const thumbInputRef = useRef()

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setThumbnail(file)
      const reader = new FileReader()
      reader.onload = (ev) => setThumbnailPreview(ev.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return setError('Nome é obrigatório')
    if (!zipFile) return setError('Arquivo ZIP é obrigatório')

    setLoading(true)
    setError('')
    try {
      await api.createTemplate({ name: name.trim(), niche: niche.trim(), zipFile, thumbnail })
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Novo Template</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Site para Nutricionistas"
              className="input-field"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nicho</label>
            <input
              type="text"
              value={niche}
              onChange={e => setNiche(e.target.value)}
              placeholder="Ex: saude, tecnologia, advocacia"
              className="input-field"
            />
          </div>

          {/* ZIP Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo ZIP *</label>
            <input
              ref={zipInputRef}
              type="file"
              accept=".zip"
              onChange={e => setZipFile(e.target.files[0])}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => zipInputRef.current.click()}
              className={`w-full border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                zipFile ? 'border-primary-300 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {zipFile ? (
                <div className="flex items-center justify-center gap-2 text-sm text-primary-700">
                  <Upload className="w-4 h-4" />
                  <span className="font-medium">{zipFile.name}</span>
                  <span className="text-primary-500">({(zipFile.size / 1024).toFixed(0)} KB)</span>
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  <Upload className="w-5 h-5 mx-auto mb-1" />
                  <span>Clique para selecionar o .zip</span>
                  <p className="text-xs mt-0.5">Deve conter template.html ou index.html</p>
                </div>
              )}
            </button>
          </div>

          {/* Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail</label>
            <input
              ref={thumbInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => thumbInputRef.current.click()}
              className={`w-full border-2 border-dashed rounded-xl overflow-hidden transition-colors ${
                thumbnailPreview ? 'border-primary-300' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Preview" className="w-full h-32 object-cover" />
              ) : (
                <div className="p-4 text-sm text-gray-400 text-center">
                  <ImageIcon className="w-5 h-5 mx-auto mb-1" />
                  <span>Clique para selecionar imagem de preview</span>
                </div>
              )}
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Criar Template
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditTemplateModal({ template, onClose, onSuccess }) {
  const [name, setName] = useState(template.name)
  const [niche, setNiche] = useState(template.niche || '')
  const [thumbnail, setThumbnail] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(template.thumbnail || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const thumbInputRef = useRef()

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setThumbnail(file)
      const reader = new FileReader()
      reader.onload = (ev) => setThumbnailPreview(ev.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return setError('Nome é obrigatório')

    setLoading(true)
    setError('')
    try {
      await api.updateTemplate(template.id, { name: name.trim(), niche: niche.trim(), thumbnail })
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <Pencil className="w-4 h-4 text-primary-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Editar Template</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Site para Nutricionistas"
              className="input-field"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nicho</label>
            <input
              type="text"
              value={niche}
              onChange={e => setNiche(e.target.value)}
              placeholder="Ex: saude, tecnologia, advocacia"
              className="input-field"
            />
          </div>

          {/* Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail</label>
            <input
              ref={thumbInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => thumbInputRef.current.click()}
              className={`w-full border-2 border-dashed rounded-xl overflow-hidden transition-colors ${
                thumbnailPreview ? 'border-primary-300' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Preview" className="w-full h-32 object-cover" />
              ) : (
                <div className="p-4 text-sm text-gray-400 text-center">
                  <ImageIcon className="w-5 h-5 mx-auto mb-1" />
                  <span>Clique para selecionar imagem de preview</span>
                </div>
              )}
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PreviewTemplateModal({ template, onClose, onEdit }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
              <Globe className="w-3.5 h-3.5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{template.name}</h2>
              {template.niche && <p className="text-xs text-gray-400">{template.niche}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Editar template"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <a
              href={`/api/template-preview.php?slug=${template.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Abrir em nova aba"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Iframe */}
        <div className="flex-1 bg-gray-50">
          <iframe
            src={`/api/template-preview.php?slug=${template.slug}`}
            className="w-full h-full border-0"
            title={`Preview: ${template.name}`}
          />
        </div>
      </div>
    </div>
  )
}

export default function Templates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [editTemplate, setEditTemplate] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const loadTemplates = useCallback(async () => {
    try {
      const data = await api.getTemplatesList()
      setTemplates(data.templates || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTemplates() }, [loadTemplates])

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeleting(deleteConfirm.id)
    try {
      await api.deleteTemplate(deleteConfirm.id)
      setDeleteConfirm(null)
      loadTemplates()
    } catch (err) {
      alert(err.message)
    } finally {
      setDeleting(null)
    }
  }

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.niche || '').toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout title="Templates">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-sm text-gray-400 mt-1">Gerencie seus templates de sites.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Novo Template
        </button>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Content */}
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
          <Layout className="w-10 h-10 mb-3" />
          <p className="text-sm font-medium text-gray-500">
            {templates.length === 0 ? 'Nenhum template cadastrado' : 'Nenhum template encontrado'}
          </p>
          {templates.length === 0 && (
            <p className="text-xs mt-1">Clique em "Novo Template" para adicionar</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((t) => (
            <div key={t.id} onClick={() => setPreviewTemplate(t)} className="bg-white rounded-xl border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow cursor-pointer">
              {/* Thumbnail / Preview */}
              <div className="aspect-[16/10] bg-gray-50 relative overflow-hidden">
                {t.thumbnail ? (
                  <img src={t.thumbnail} alt={t.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Globe className="w-8 h-8 text-gray-200" />
                  </div>
                )}
                {/* Delete button overlay */}
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm(t) }}
                  disabled={deleting === t.id}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-white opacity-0 group-hover:opacity-100 transition-all"
                  title="Excluir template"
                >
                  {deleting === t.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Info */}
              <div className="p-3.5">
                <h3 className="text-sm font-medium text-gray-900 truncate">{t.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {t.niche && (
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{t.niche}</span>
                  )}
                  <span className="text-xs text-gray-300">{t.slug}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateTemplateModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false)
            loadTemplates()
          }}
        />
      )}

      {previewTemplate && (
        <PreviewTemplateModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onEdit={() => setEditTemplate(previewTemplate)}
        />
      )}

      {editTemplate && (
        <EditTemplateModal
          template={editTemplate}
          onClose={() => setEditTemplate(null)}
          onSuccess={() => {
            setEditTemplate(null)
            setPreviewTemplate(null)
            loadTemplates()
          }}
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
                <h3 className="font-semibold text-gray-900">Excluir template</h3>
                <p className="text-sm text-gray-500">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Tem certeza que deseja excluir o template <strong>{deleteConfirm.name}</strong>? Todos os arquivos do template serão removidos permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={!!deleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={!!deleting}
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
