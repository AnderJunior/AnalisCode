import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Leaf, CheckCircle2, XCircle, AlertCircle, Loader2,
  MessageSquare, ThumbsUp, RotateCcw, ExternalLink
} from 'lucide-react'
import * as api from '../../services/api.js'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium">Carregando página de revisão...</p>
      </div>
    </div>
  )
}

function ErrorScreen({ message }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Link inválido</h2>
        <p className="text-gray-500">{message}</p>
      </div>
    </div>
  )
}

function ApprovedScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center px-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-lg">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">Site Aprovado!</h2>
      <p className="text-gray-500 text-lg leading-relaxed max-w-sm">
        Ótimo! Nossa equipe foi notificada e irá publicar o seu site em breve.
      </p>
      <div className="mt-8 bg-green-50 border border-green-200 rounded-2xl px-6 py-5 max-w-sm w-full">
        <p className="text-green-700 text-sm font-medium">
          Você receberá uma confirmação assim que o site for publicado.
        </p>
      </div>
    </div>
  )
}

function RevisionRequestedScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center px-6">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 shadow-lg">
        <CheckCircle2 className="w-10 h-10 text-blue-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">Alterações enviadas!</h2>
      <p className="text-gray-500 text-lg leading-relaxed max-w-sm">
        Nossa equipe recebeu suas solicitações e irá realizar os ajustes necessários.
      </p>
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl px-6 py-5 max-w-sm w-full">
        <p className="text-blue-700 text-sm font-medium">
          Você receberá um novo link para revisão após os ajustes.
        </p>
      </div>
    </div>
  )
}

export default function ReviewPage() {
  const { token } = useParams()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionState, setActionState] = useState(null) // null | 'approved' | 'revision_requested'
  const [showRevisionForm, setShowRevisionForm] = useState(false)
  const [revisionMessage, setRevisionMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [iframeError, setIframeError] = useState(false)

  const previewUrl = `/api/preview.php?token=${token}`

  const handleApprove = async () => {
    setSubmitting(true)
    setSubmitError('')
    try {
      await api.approveReview(token, 'approve', '')
      setActionState('approved')
    } catch (err) {
      setSubmitError(err.message || 'Erro ao aprovar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRequestRevision = async () => {
    if (!revisionMessage.trim()) {
      setSubmitError('Descreva as alterações desejadas')
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      await api.approveReview(token, 'request_revision', revisionMessage.trim())
      setActionState('revision_requested')
    } catch (err) {
      setSubmitError(err.message || 'Erro ao enviar revisão. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  // Right panel content based on state
  const renderRightPanel = () => {
    if (actionState === 'approved') return <ApprovedScreen />
    if (actionState === 'revision_requested') return <RevisionRequestedScreen />

    return (
      <div className="flex flex-col h-full">
        {/* Branding */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-gray-900 text-xl">AnalisCode</span>
            <p className="text-xs text-gray-400">Revisão do Site</p>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            Revisão do seu site
          </h1>
          <p className="text-gray-500 mt-2 leading-relaxed">
            Analise o preview do seu site ao lado e nos diga o que você pensa.
            Você pode aprovar ou solicitar alterações.
          </p>
        </div>

        {/* Action buttons */}
        {!showRevisionForm ? (
          <div className="space-y-3 flex-1">
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl shadow-lg shadow-primary-600/20 transition-all duration-200 text-lg"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ThumbsUp className="w-5 h-5" />
              )}
              Aprovar Site
            </button>

            <button
              onClick={() => setShowRevisionForm(true)}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-2xl transition-all duration-200 text-lg"
            >
              <RotateCcw className="w-5 h-5" />
              Solicitar Alteração
            </button>

            {submitError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-red-600 text-sm">{submitError}</p>
              </div>
            )}

            <div className="pt-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-amber-700 text-sm leading-relaxed">
                  <strong>Dica:</strong> Use o preview ao lado para navegar pelo site antes de tomar sua decisão.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => { setShowRevisionForm(false); setSubmitError('') }}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Voltar
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                Descreva as alterações desejadas
              </label>
              <textarea
                value={revisionMessage}
                onChange={(e) => setRevisionMessage(e.target.value)}
                placeholder="Ex: Gostaria de mudar a cor do cabeçalho para azul, e alterar o texto da seção de contato..."
                rows={6}
                disabled={submitting}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{revisionMessage.length} caracteres</p>
            </div>

            {submitError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-red-600 text-sm">{submitError}</p>
              </div>
            )}

            <button
              onClick={handleRequestRevision}
              disabled={submitting || !revisionMessage.trim()}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl shadow-lg shadow-red-600/20 transition-all duration-200"
            >
              {submitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>
              ) : (
                <><RotateCcw className="w-5 h-5" /> Enviar Solicitação</>
              )}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            AnalisCode © {new Date().getFullYear()} — Plataforma de criação de sites
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      {/* Left — Preview */}
      <div className="flex-1 lg:w-[60%] bg-white border-r border-gray-200 flex flex-col min-h-[50vh] lg:min-h-screen">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <span className="text-xs text-gray-500 ml-2 font-medium">Preview do Site</span>
          </div>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary-600 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir em nova aba
          </a>
        </div>

        {iframeError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
            <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mb-4">
              <ExternalLink className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-gray-700 font-semibold mb-2">Preview indisponível no frame</h3>
            <p className="text-gray-400 text-sm mb-4">
              O preview pode não estar disponível incorporado.
            </p>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir preview em nova aba
            </a>
          </div>
        ) : (
          <iframe
            src={previewUrl}
            className="flex-1 w-full border-0"
            title="Preview do Site"
            onError={() => setIframeError(true)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        )}
      </div>

      {/* Right — Actions */}
      <div className="w-full lg:w-[40%] lg:max-w-md bg-white border-l border-gray-200 flex flex-col">
        <div className="flex-1 overflow-y-auto p-8">
          {renderRightPanel()}
        </div>
      </div>
    </div>
  )
}
